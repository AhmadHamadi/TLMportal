import { z } from "zod";
import { optionalString } from "./shared";

export const AUTOMATION_TRIGGERS = [
  "LEAD_CREATED",
  "APPOINTMENT_CONFIRMED",
  "APPOINTMENT_ACCEPTED",
  "CONTRACTOR_NO_REPLY_24H",
] as const;

export const AUTOMATION_ACTION_TYPES = ["SEND_SMS", "NOTIFY_ADMIN", "MARK_FOR_REVIEW"] as const;

export const automationRuleCreateSchema = z.object({
  customerId: z.string().min(1),
  name: z.string().min(2),
  trigger: z.enum(AUTOMATION_TRIGGERS),
  actionType: z.enum(AUTOMATION_ACTION_TYPES),
  smsTemplate: optionalString,
  isActive: z.coerce.boolean().default(true),
});
export type AutomationRuleCreateInput = z.infer<typeof automationRuleCreateSchema>;

export const ALLOWED_TEMPLATE_VARS = [
  "firstName",
  "service",
  "city",
  "neighbourhood",
  "preferredTime",
  "projectDetails",
] as const;
