import { Prisma } from "@prisma/client";

const CAD_FORMATTER = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

export function formatMoney(amount: Prisma.Decimal | number | string): string {
  const n = typeof amount === "object" ? Number(amount.toString()) : Number(amount);
  return CAD_FORMATTER.format(Number.isFinite(n) ? n : 0);
}

export function toDecimalString(amount: Prisma.Decimal | number | string): string {
  if (typeof amount === "object") return amount.toString();
  return Number(amount).toFixed(2);
}
