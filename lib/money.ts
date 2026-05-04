import { Prisma } from "@prisma/client";

export type BillingCurrency = "CAD" | "USD";

const FORMATTERS: Record<BillingCurrency, Intl.NumberFormat> = {
  CAD: new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }),
  USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
};

export function isBillingCurrency(value: unknown): value is BillingCurrency {
  return value === "CAD" || value === "USD";
}

// Currency-aware money formatter. Defaults to CAD so existing callers stay
// correct without a code change; pass the customer's billingCurrency where
// you have it (admin billing, contractor dashboard, report, contract,
// invoice description) so USD customers see "US$" not "CA$".
export function formatMoney(
  amount: Prisma.Decimal | number | string,
  currency: BillingCurrency = "CAD",
): string {
  const n = typeof amount === "object" ? Number(amount.toString()) : Number(amount);
  const safe = Number.isFinite(n) ? n : 0;
  const formatter = FORMATTERS[currency] ?? FORMATTERS.CAD;
  return formatter.format(safe);
}

export function toDecimalString(amount: Prisma.Decimal | number | string): string {
  if (typeof amount === "object") return amount.toString();
  return Number(amount).toFixed(2);
}

// Stripe expects the smallest unit (cents). Centralized so we can't drift
// across stripe.ts and tests.
export function toStripeAmount(amount: Prisma.Decimal | number | string): number {
  const n = typeof amount === "object" ? Number(amount.toString()) : Number(amount);
  return Math.round((Number.isFinite(n) ? n : 0) * 100);
}

export function stripeCurrency(currency: BillingCurrency): "cad" | "usd" {
  return currency === "USD" ? "usd" : "cad";
}
