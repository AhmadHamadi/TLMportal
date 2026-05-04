import { afterAll, afterEach, beforeAll, describe, it, expect, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { getSeededCustomers, getSeededUsers, testDb } from "./helpers";
import type { AuthCtx } from "@/lib/auth-guard";

// Stripe is mocked: we are NOT making real API calls. The point of this
// integration test is to assert that our service layer:
//   1. Threads customer.billingCurrency (CAD vs USD) through to Stripe.
//   2. Uses cents (smallest unit) consistently.
//   3. Freezes currency on BillingRecord at creation.
//   4. Is idempotent — re-pushing a record never double-invoices.
//   5. Refuses to start a subscription in a different currency than the
//      existing StripeSubscription row (currency switching has to go
//      through cancel-and-recreate explicitly).

// ---------- Stripe mock ---------------------------------------------------
const captured = {
  customers: [] as Array<Record<string, unknown>>,
  prices: [] as Array<Record<string, unknown>>,
  subscriptions: [] as Array<Record<string, unknown>>,
  invoiceItems: [] as Array<Record<string, unknown>>,
  productNames: [] as string[],
};

let custCounter = 0;
let prodCounter = 0;
let priceCounter = 0;
let subCounter = 0;
let itemCounter = 0;

const stripeMock = {
  customers: {
    create: vi.fn(async (args: Record<string, unknown>) => {
      captured.customers.push(args);
      custCounter += 1;
      return { id: `cus_test_${custCounter}` };
    }),
  },
  products: {
    create: vi.fn(async (args: { name: string }) => {
      captured.productNames.push(args.name);
      prodCounter += 1;
      return { id: `prod_test_${prodCounter}` };
    }),
  },
  prices: {
    create: vi.fn(async (args: Record<string, unknown>) => {
      captured.prices.push(args);
      priceCounter += 1;
      return { id: `price_test_${priceCounter}` };
    }),
  },
  subscriptions: {
    create: vi.fn(async (args: Record<string, unknown>) => {
      captured.subscriptions.push(args);
      subCounter += 1;
      return {
        id: `sub_test_${subCounter}`,
        status: "active",
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
      };
    }),
  },
  invoiceItems: {
    create: vi.fn(async (args: Record<string, unknown>) => {
      captured.invoiceItems.push(args);
      itemCounter += 1;
      return { id: `ii_test_${itemCounter}` };
    }),
  },
};

vi.mock("@/lib/stripe", () => ({
  isStripeConfigured: () => true,
  getStripe: () => stripeMock,
  verifyStripeSignature: () => {
    throw new Error("not used in this test");
  },
}));

// ---------- Lifecycle ----------------------------------------------------
let svc: typeof import("@/server/services/stripe");

beforeAll(async () => {
  svc = await import("@/server/services/stripe");
});

afterEach(async () => {
  // Reset Stripe-side state on every test so leftover subscriptions don't
  // leak. Test customer DB rows survive across tests because we tracked
  // them in the seeded customers — we only delete the Stripe linkage.
  const { atlas, northside } = await getSeededCustomers();
  await testDb.stripeSubscription.deleteMany({
    where: { customerId: { in: [atlas.id, northside.id] } },
  });
  await testDb.billingRecord.deleteMany({
    where: { customerId: { in: [atlas.id, northside.id] }, type: "SETUP_FEE" },
  });
  captured.customers.length = 0;
  captured.prices.length = 0;
  captured.subscriptions.length = 0;
  captured.invoiceItems.length = 0;
  captured.productNames.length = 0;
  vi.clearAllMocks();
});

afterAll(async () => {
  await testDb.$disconnect();
});

async function adminCtx(): Promise<AuthCtx> {
  const { admin } = await getSeededUsers();
  return { role: "ADMIN", userId: admin.id };
}

// ---------- Tests ---------------------------------------------------------
describe("stripe billing — currency, rounding, idempotency", () => {
  it("creates a CAD subscription for a CAD customer with cents-correct amount", async () => {
    const ctx = await adminCtx();
    const { atlas } = await getSeededCustomers();
    // Atlas seed: monthlyRetainer = 750 CAD.
    expect(atlas.billingCurrency).toBe("CAD");

    const out = await svc.startMonthlySubscription(ctx, atlas.id);
    expect(out.currency).toBe("CAD");
    expect(captured.prices).toHaveLength(1);
    expect(captured.prices[0]).toMatchObject({ currency: "cad", unit_amount: 75000 });
    expect(captured.prices[0]).toMatchObject({ recurring: { interval: "month" } });

    const persisted = await testDb.stripeSubscription.findUnique({
      where: { customerId: atlas.id },
    });
    expect(persisted?.currency).toBe("CAD");
  });

  it("creates a USD subscription for a USD customer", async () => {
    const ctx = await adminCtx();
    const { northside } = await getSeededCustomers();
    // Northside seed: monthlyRetainer = 600 USD.
    expect(northside.billingCurrency).toBe("USD");

    await svc.startMonthlySubscription(ctx, northside.id);
    expect(captured.prices[0]).toMatchObject({ currency: "usd", unit_amount: 60000 });

    const persisted = await testDb.stripeSubscription.findUnique({
      where: { customerId: northside.id },
    });
    expect(persisted?.currency).toBe("USD");
  });

  it("freezes currency on BillingRecord at creation and uses it when invoicing", async () => {
    const ctx = await adminCtx();
    const { northside } = await getSeededCustomers();

    // Create an APPOINTMENT_FEE record manually with currency=USD frozen on it
    // (mirrors what billing.approveAppointmentFee does at runtime).
    const record = await testDb.billingRecord.create({
      data: {
        customerId: northside.id,
        type: "APPOINTMENT_FEE",
        amount: new Prisma.Decimal("125.50"),
        currency: "USD",
        status: "APPROVED",
        billingMonth: "2026-05",
        description: "USD appointment fee",
      },
    });

    await svc.pushBillingRecordToStripe(ctx, record.id);
    expect(captured.invoiceItems).toHaveLength(1);
    expect(captured.invoiceItems[0]).toMatchObject({
      currency: "usd",
      amount: 12550,
      description: "USD appointment fee",
    });

    // Cleanup
    await testDb.billingRecord.delete({ where: { id: record.id } });
  });

  it("is idempotent — re-pushing the same record never creates a second invoice item", async () => {
    const ctx = await adminCtx();
    const { atlas } = await getSeededCustomers();

    const record = await testDb.billingRecord.create({
      data: {
        customerId: atlas.id,
        type: "APPOINTMENT_FEE",
        amount: new Prisma.Decimal("125.00"),
        currency: "CAD",
        status: "APPROVED",
        billingMonth: "2026-05",
        description: "Idempotent test",
      },
    });

    const a = await svc.pushBillingRecordToStripe(ctx, record.id);
    const b = await svc.pushBillingRecordToStripe(ctx, record.id);
    expect(a.stripeInvoiceItemId).toBe(b.stripeInvoiceItemId);
    expect(captured.invoiceItems).toHaveLength(1);

    await testDb.billingRecord.delete({ where: { id: record.id } });
  });

  it("refuses to switch a subscription's currency without an explicit cancel", async () => {
    const ctx = await adminCtx();
    const { atlas } = await getSeededCustomers();

    // Stand up an existing USD subscription for Atlas (artificial — the
    // customer is CAD). This simulates the case where someone changed
    // Customer.billingCurrency after a sub was already running.
    await testDb.stripeSubscription.create({
      data: {
        customerId: atlas.id,
        stripeCustomerId: "cus_old",
        stripeSubscriptionId: "sub_old",
        status: "active",
        currency: "USD",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      },
    });

    // Atlas's customer record is CAD — service must refuse rather than
    // silently start a second subscription in a mismatched currency.
    await expect(svc.startMonthlySubscription(ctx, atlas.id)).rejects.toThrow(/USD/);

    // No new Stripe calls should have happened.
    expect(stripeMock.subscriptions.create).not.toHaveBeenCalled();
  });

  it("onboardCustomerInStripe runs setup-fee + subscription in one shot, in customer currency", async () => {
    const ctx = await adminCtx();
    const { atlas } = await getSeededCustomers();
    // Atlas seed: setupFee=1500 CAD, monthlyRetainer=750 CAD.

    const out = await svc.onboardCustomerInStripe(ctx, atlas.id);
    expect(out.currency).toBe("CAD");
    expect(out.setupBillingRecordId).toBeTruthy();

    // Setup invoice item created at 1500 CAD = 150000 cents.
    const setupItem = captured.invoiceItems.find((i) => i.amount === 150000);
    expect(setupItem).toBeTruthy();
    expect(setupItem).toMatchObject({ currency: "cad" });

    // Subscription price is 750 CAD = 75000 cents.
    expect(captured.prices[0]).toMatchObject({ currency: "cad", unit_amount: 75000 });

    // The setup BillingRecord row was persisted with currency=CAD and the
    // invoice item id back-filled.
    const setupRecord = await testDb.billingRecord.findUnique({
      where: { id: out.setupBillingRecordId! },
    });
    expect(setupRecord?.currency).toBe("CAD");
    expect(setupRecord?.stripeInvoiceItemId).toBeTruthy();
    expect(setupRecord?.status).toBe("INVOICED");
  });

  it("rejects subscription start when monthlyRetainer is 0 (avoids 0-amount Stripe price)", async () => {
    const ctx = await adminCtx();
    const { atlas } = await getSeededCustomers();
    // Temporarily zero out the retainer.
    await testDb.customer.update({
      where: { id: atlas.id },
      data: { monthlyRetainer: new Prisma.Decimal(0) },
    });
    await expect(svc.startMonthlySubscription(ctx, atlas.id)).rejects.toThrow(/retainer/i);
    // Restore.
    await testDb.customer.update({
      where: { id: atlas.id },
      data: { monthlyRetainer: new Prisma.Decimal(750) },
    });
  });

  it("requires ADMIN role for every billing-side mutation", async () => {
    const { atlas } = await getSeededCustomers();
    const contractorCtx: AuthCtx = {
      role: "CONTRACTOR",
      userId: "fake-user",
      customerIds: [atlas.id],
    };
    await expect(svc.ensureStripeCustomer(contractorCtx, atlas.id)).rejects.toThrow();
    await expect(svc.startMonthlySubscription(contractorCtx, atlas.id)).rejects.toThrow();
    await expect(svc.onboardCustomerInStripe(contractorCtx, atlas.id)).rejects.toThrow();
  });
});
