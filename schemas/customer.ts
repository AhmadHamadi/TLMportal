import { z } from "zod";
import {
  moneyAmount,
  optionalEmail,
  optionalPhoneE164,
  optionalString,
  phoneE164,
} from "./shared";

export const customerCreateSchema = z.object({
  businessName: z.string().min(2, "Business name required"),
  contactName: z.string().min(2, "Contact name required"),
  email: z.string().email("Valid email required").transform((s) => s.toLowerCase()),
  phone: phoneE164,
  forwardingPhone: phoneE164,
  websiteUrl: optionalString,
  landingPageUrl: optionalString,
  googleAdsCustomerId: optionalString,
  setupFee: moneyAmount.default("0"),
  monthlyRetainer: moneyAmount.default("0"),
  appointmentFee: moneyAmount.default("0"),
  monthlyAdBudget: moneyAmount.default("0"),
  minProjectSize: z
    .union([z.string(), z.number(), z.literal("")])
    .optional()
    .transform((v, ctx) => {
      if (v === undefined || v === null || v === "") return null;
      const n = typeof v === "string" ? Number(v) : v;
      if (!Number.isFinite(n) || n < 0) {
        ctx.addIssue({ code: "custom", message: "Invalid amount" });
        return z.NEVER;
      }
      return n.toFixed(2);
    }),
  disputeWindowHours: z.coerce.number().int().min(1).max(168).default(48),
  status: z.enum(["ACTIVE", "PAUSED", "WINTER_MODE", "CANCELLED"]).default("ACTIVE"),
  notes: optionalString,
});
export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;

export const customerUpdateSchema = customerCreateSchema.partial().extend({
  id: z.string().min(1),
});
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;

export const serviceCreateSchema = z.object({
  customerId: z.string().min(1),
  name: z.string().min(2),
  isActive: z.coerce.boolean().default(true),
});
export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;

export const serviceAreaCreateSchema = z.object({
  customerId: z.string().min(1),
  city: z.string().min(2),
  neighbourhood: optionalString,
  province: z.string().default("ON"),
  isActive: z.coerce.boolean().default(true),
});
export type ServiceAreaCreateInput = z.infer<typeof serviceAreaCreateSchema>;

export const customerUserInviteSchema = z.object({
  customerId: z.string().min(1),
  email: z.string().email().transform((s) => s.toLowerCase()),
  name: z.string().min(2),
  password: z.string().min(8, "At least 8 characters"),
  phone: optionalPhoneE164.optional(),
  emailConfirm: optionalEmail.optional(),
});
export type CustomerUserInviteInput = z.infer<typeof customerUserInviteSchema>;
