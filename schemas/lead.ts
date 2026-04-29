import { z } from "zod";
import { optionalEmail, optionalPhoneE164, optionalString } from "./shared";

export const LEAD_SOURCE_VALUES = [
  "LANDING_PAGE_FORM",
  "GOOGLE_ADS_LEAD_FORM",
  "TRACKING_PHONE_CALL",
  "SMS_REPLY",
  "MANUAL_ADMIN_ENTRY",
  "QUOTE_BUTTON",
] as const;

export const LEAD_STATUS_VALUES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "APPOINTMENT_REQUESTED",
  "APPOINTMENT_CONFIRMED",
  "SENT_TO_CONTRACTOR",
  "ACCEPTED_BY_CONTRACTOR",
  "DECLINED_BY_CONTRACTOR",
  "COMPLETED_ESTIMATE",
  "QUOTED",
  "WON",
  "LOST",
  "DISPUTED",
  "NOT_BILLABLE",
  "CANCELLED",
  "DUPLICATE",
  "SPAM",
] as const;

export const BILLABLE_STATUS_VALUES = [
  "PENDING",
  "BILLABLE",
  "NOT_BILLABLE",
  "DISPUTED",
] as const;

export const NOT_BILLABLE_REASON_VALUES = [
  "SPAM",
  "WRONG_NUMBER",
  "DUPLICATE_30D",
  "OUTSIDE_SERVICE_AREA",
  "SERVICE_NOT_OFFERED",
  "BELOW_MIN_JOB_SIZE",
  "CANCELLED_BEFORE_CONFIRMATION",
  "EXISTING_CUSTOMER",
  "EMPLOYMENT_REQUEST",
  "VENDOR_INQUIRY",
  "DIY_QUESTION",
  "OTHER",
] as const;

export const leadCreateSchema = z.object({
  customerId: z.string().min(1),
  source: z.enum(LEAD_SOURCE_VALUES).default("MANUAL_ADMIN_ENTRY"),
  firstName: optionalString,
  lastName: optionalString,
  phone: optionalPhoneE164,
  email: optionalEmail,
  city: optionalString,
  neighbourhood: optionalString,
  address: optionalString,
  serviceRequested: optionalString,
  projectDetails: optionalString,
  preferredTime: optionalString,
  estimatedProjectSize: z
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
});
export type LeadCreateInput = z.infer<typeof leadCreateSchema>;

export const leadStatusUpdateSchema = z.object({
  leadId: z.string().min(1),
  status: z.enum(LEAD_STATUS_VALUES),
  note: optionalString,
});
export type LeadStatusUpdateInput = z.infer<typeof leadStatusUpdateSchema>;

export const leadBillableUpdateSchema = z.object({
  leadId: z.string().min(1),
  billableStatus: z.enum(BILLABLE_STATUS_VALUES),
  notBillableReason: z.enum(NOT_BILLABLE_REASON_VALUES).optional().nullable(),
});
export type LeadBillableUpdateInput = z.infer<typeof leadBillableUpdateSchema>;

export const leadFilterSchema = z.object({
  customerId: z.string().optional(),
  source: z.enum(LEAD_SOURCE_VALUES).optional(),
  status: z.enum(LEAD_STATUS_VALUES).optional(),
  billableStatus: z.enum(BILLABLE_STATUS_VALUES).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
});
export type LeadFilterInput = z.infer<typeof leadFilterSchema>;
