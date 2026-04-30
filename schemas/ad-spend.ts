import { z } from "zod";
import { moneyAmount, optionalString } from "./shared";

export const adSpendUpsertSchema = z.object({
  customerId: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Use YYYY-MM"),
  spendAmount: moneyAmount,
  impressions: z.coerce.number().int().min(0).optional(),
  clicks: z.coerce.number().int().min(0).optional(),
  conversions: z.coerce.number().int().min(0).optional(),
  notes: optionalString,
});
export type AdSpendUpsertInput = z.infer<typeof adSpendUpsertSchema>;

export const adBudgetRequestSchema = z.object({
  customerId: z.string().min(1),
  requestedBudget: z.coerce
    .number({ error: "Enter a Google Ads budget." })
    .finite()
    .min(700, "Minimum Google Ads budget request is 700."),
  currency: z.enum(["CAD", "USD"]).default("CAD"),
  direction: z.enum(["keep", "increase", "decrease", "change"]).default("change"),
  note: optionalString,
});
export type AdBudgetRequestInput = z.infer<typeof adBudgetRequestSchema>;
