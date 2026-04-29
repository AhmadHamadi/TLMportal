import "server-only";
import { db } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { writeAudit } from "./audit";
import { ForbiddenError, type AuthCtx } from "@/lib/auth-guard";

export class StripeNotConfiguredError extends Error {
  constructor() {
    super("Stripe is not configured. Add STRIPE_SECRET_KEY to .env.");
    this.name = "StripeNotConfiguredError";
  }
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
    metadata: { tlm_customer_id: cust.id, slug: cust.slug },
  });

  await writeAudit({
    userId: ctx.userId,
    customerId: cust.id,
    action: "STRIPE_CUSTOMER_CREATED",
    entityType: "Customer",
    entityId: cust.id,
    metadata: { stripeCustomerId: created.id },
  });

  return { stripeCustomerId: created.id, created: true };
}

export async function startMonthlySubscription(
  ctx: AuthCtx,
  customerId: string,
): Promise<{ subscriptionId: string }> {
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

  const { stripeCustomerId } = await ensureStripeCustomer(ctx, customerId);

  const product = await stripe.products.create({
    name: `${cust.businessName} — TLM monthly retainer`,
    metadata: { tlm_customer_id: cust.id },
  });
  const price = await stripe.prices.create({
    product: product.id,
    currency: "cad",
    unit_amount: Math.round(Number(cust.monthlyRetainer.toString()) * 100),
    recurring: { interval: "month" },
  });

  const sub = await stripe.subscriptions.create({
    customer: stripeCustomerId,
    items: [{ price: price.id }],
    collection_method: "send_invoice",
    days_until_due: 7,
    metadata: { tlm_customer_id: cust.id },
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
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
    update: {
      stripeCustomerId,
      stripeSubscriptionId: sub.id,
      status: sub.status,
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
  });
  return { subscriptionId: sub.id };
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

  const { stripeCustomerId } = await ensureStripeCustomer(ctx, record.customerId);

  const item = await stripe.invoiceItems.create({
    customer: stripeCustomerId,
    amount: Math.round(Number(record.amount.toString()) * 100),
    currency: "cad",
    description:
      record.description ??
      `${record.type.replace(/_/g, " ")} — ${record.billingMonth}`,
    metadata: {
      tlm_billing_record_id: record.id,
      tlm_customer_id: record.customerId,
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
    metadata: { stripeInvoiceItemId: item.id },
  });
  return { stripeInvoiceItemId: item.id };
}

export { isStripeConfigured };
