import "server-only";
import { db } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { writeAudit } from "./audit";
import { ForbiddenError, type AuthCtx } from "@/lib/auth-guard";
import { isBillingCurrency, stripeCurrency, toStripeAmount, type BillingCurrency } from "@/lib/money";

export class StripeNotConfiguredError extends Error {
  constructor() {
    super("Stripe is not configured. Add STRIPE_SECRET_KEY to .env.");
    this.name = "StripeNotConfiguredError";
  }
}

function customerCurrency(value: string | null | undefined): BillingCurrency {
  return isBillingCurrency(value) ? value : "CAD";
}

export async function ensureStripeCustomer(
  ctx: AuthCtx,
  customerId: string,
): Promise<{ stripeCustomerId: string; created: boolean }> {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  if (!isStripeConfigured()) throw new StripeNotConfiguredError();
  const stripe = getStripe();

  const cust = await db.customer.findUnique({
    where: { id: customerId },
    include: { stripeSubscription: true },
  });
  if (!cust) throw new Error("Customer not found");

  if (cust.stripeSubscription?.stripeCustomerId) {
    return { stripeCustomerId: cust.stripeSubscription.stripeCustomerId, created: false };
  }

  const created = await stripe.customers.create({
    name: cust.businessName,
    email: cust.email,
    phone: cust.phone,
    metadata: {
      tlm_customer_id: cust.id,
      slug: cust.slug,
      tlm_billing_currency: customerCurrency(cust.billingCurrency),
    },
  });

  await writeAudit({
    userId: ctx.userId,
    customerId: cust.id,
    action: "STRIPE_CUSTOMER_CREATED",
    entityType: "Customer",
    entityId: cust.id,
    metadata: { stripeCustomerId: created.id, currency: customerCurrency(cust.billingCurrency) },
  });

  return { stripeCustomerId: created.id, created: true };
}

export async function startMonthlySubscription(
  ctx: AuthCtx,
  customerId: string,
): Promise<{ subscriptionId: string; currency: BillingCurrency }> {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  if (!isStripeConfigured()) throw new StripeNotConfiguredError();
  const stripe = getStripe();

  const cust = await db.customer.findUnique({
    where: { id: customerId },
    include: { stripeSubscription: true },
  });
  if (!cust) throw new Error("Customer not found");
  if (Number(cust.monthlyRetainer.toString()) <= 0) {
    throw new Error("Monthly retainer is 0; set it on the customer first.");
  }

  const currency = customerCurrency(cust.billingCurrency);

  // Stripe locks currency on a subscription at create-time. If we already
  // have a subscription in a different currency, refuse — operator has to
  // cancel and start a fresh subscription, which is the right surface for
  // such a destructive change.
  if (
    cust.stripeSubscription &&
    cust.stripeSubscription.currency !== currency
  ) {
    throw new Error(
      `Existing Stripe subscription is in ${cust.stripeSubscription.currency} but customer is now ${currency}. Cancel it before changing currency.`,
    );
  }

  const { stripeCustomerId } = await ensureStripeCustomer(ctx, customerId);

  const product = await stripe.products.create({
    name: `${cust.businessName} — TLM monthly retainer`,
    metadata: { tlm_customer_id: cust.id },
  });
  const price = await stripe.prices.create({
    product: product.id,
    currency: stripeCurrency(currency),
    unit_amount: toStripeAmount(cust.monthlyRetainer),
    recurring: { interval: "month" },
  });

  const sub = await stripe.subscriptions.create({
    customer: stripeCustomerId,
    items: [{ price: price.id }],
    collection_method: "send_invoice",
    days_until_due: 7,
    metadata: { tlm_customer_id: cust.id, tlm_billing_currency: currency },
  });

  const subAny = sub as unknown as { current_period_start?: number; current_period_end?: number };
  const periodStart = subAny.current_period_start
    ? new Date(subAny.current_period_start * 1000)
    : new Date();
  const periodEnd = subAny.current_period_end
    ? new Date(subAny.current_period_end * 1000)
    : new Date(Date.now() + 30 * 24 * 3600 * 1000);

  await db.stripeSubscription.upsert({
    where: { customerId },
    create: {
      customerId,
      stripeCustomerId,
      stripeSubscriptionId: sub.id,
      status: sub.status,
      currency,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
    update: {
      stripeCustomerId,
      stripeSubscriptionId: sub.id,
      status: sub.status,
      currency,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
  });
  await writeAudit({
    userId: ctx.userId,
    customerId,
    action: "STRIPE_SUBSCRIPTION_STARTED",
    entityType: "StripeSubscription",
    entityId: sub.id,
    metadata: { currency },
  });
  return { subscriptionId: sub.id, currency };
}

export async function pushBillingRecordToStripe(
  ctx: AuthCtx,
  billingRecordId: string,
): Promise<{ stripeInvoiceItemId: string }> {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  if (!isStripeConfigured()) throw new StripeNotConfiguredError();
  const stripe = getStripe();

  const record = await db.billingRecord.findUnique({
    where: { id: billingRecordId },
    include: { customer: { include: { stripeSubscription: true } } },
  });
  if (!record) throw new Error("Billing record not found");
  if (record.stripeInvoiceItemId) {
    return { stripeInvoiceItemId: record.stripeInvoiceItemId };
  }

  // Use the currency frozen on the BillingRecord at creation time, not the
  // current customer.billingCurrency — historical records stay correct even
  // if the customer's default currency was changed.
  const currency = isBillingCurrency(record.currency) ? record.currency : "CAD";

  const { stripeCustomerId } = await ensureStripeCustomer(ctx, record.customerId);

  const item = await stripe.invoiceItems.create({
    customer: stripeCustomerId,
    amount: toStripeAmount(record.amount),
    currency: stripeCurrency(currency),
    description:
      record.description ??
      `${record.type.replace(/_/g, " ")} — ${record.billingMonth}`,
    metadata: {
      tlm_billing_record_id: record.id,
      tlm_customer_id: record.customerId,
      tlm_billing_currency: currency,
    },
  });

  await db.billingRecord.update({
    where: { id: billingRecordId },
    data: { stripeInvoiceItemId: item.id, status: "INVOICED" },
  });
  await writeAudit({
    userId: ctx.userId,
    customerId: record.customerId,
    action: "BILLING_RECORD_INVOICED",
    entityType: "BillingRecord",
    entityId: record.id,
    metadata: { stripeInvoiceItemId: item.id, currency },
  });
  return { stripeInvoiceItemId: item.id };
}

// One-shot helper used at customer onboarding: create a Stripe customer,
// invoice the setup fee (if > 0), and start the recurring subscription.
// Single entry point so we never half-onboard a customer.
export async function onboardCustomerInStripe(
  ctx: AuthCtx,
  customerId: string,
): Promise<{
  stripeCustomerId: string;
  setupBillingRecordId: string | null;
  subscriptionId: string;
  currency: BillingCurrency;
}> {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  if (!isStripeConfigured()) throw new StripeNotConfiguredError();

  const cust = await db.customer.findUnique({
    where: { id: customerId },
    include: { stripeSubscription: true },
  });
  if (!cust) throw new Error("Customer not found");
  const currency = customerCurrency(cust.billingCurrency);

  await ensureStripeCustomer(ctx, customerId);

  // Setup fee — write a BillingRecord first so it's auditable, then push it
  // into Stripe in the same call.
  let setupBillingRecordId: string | null = null;
  if (Number(cust.setupFee.toString()) > 0) {
    const month = `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`;
    const existing = await db.billingRecord.findFirst({
      where: { customerId, type: "SETUP_FEE" },
    });
    const setupRecord =
      existing ??
      (await db.billingRecord.create({
        data: {
          customerId,
          type: "SETUP_FEE",
          amount: cust.setupFee,
          currency,
          status: "APPROVED",
          billingMonth: month,
          description: "Onboarding setup fee",
        },
      }));
    setupBillingRecordId = setupRecord.id;
    if (!setupRecord.stripeInvoiceItemId) {
      await pushBillingRecordToStripe(ctx, setupRecord.id);
    }
  }

  const { subscriptionId } = await startMonthlySubscription(ctx, customerId);

  const stripeCustomerId = (await db.stripeSubscription.findUniqueOrThrow({
    where: { customerId },
  })).stripeCustomerId;

  return { stripeCustomerId, setupBillingRecordId, subscriptionId, currency };
}

export { isStripeConfigured };
