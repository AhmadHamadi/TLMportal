-- Adds per-customer billing currency (CAD or USD) and freezes it onto
-- BillingRecord and StripeSubscription so historical rows are auditable.

ALTER TABLE "Customer" ADD COLUMN "billingCurrency" TEXT NOT NULL DEFAULT 'CAD';
ALTER TABLE "BillingRecord" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'CAD';
ALTER TABLE "StripeSubscription" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'CAD';
