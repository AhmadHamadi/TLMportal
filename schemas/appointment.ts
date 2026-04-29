import { z } from "zod";
import { optionalString } from "./shared";

export const APPOINTMENT_STATUS_VALUES = [
  "REQUESTED",
  "CONFIRMED",
  "SENT_TO_CONTRACTOR",
  "ACCEPTED",
  "DECLINED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;

export const appointmentCreateSchema = z.object({
  leadId: z.string().min(1),
  appointmentWindowStart: z
    .string()
    .optional()
    .transform((s) => (s && s.trim() ? new Date(s) : null)),
  appointmentWindowEnd: z
    .string()
    .optional()
    .transform((s) => (s && s.trim() ? new Date(s) : null)),
  notes: optionalString,
});
export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>;

export const appointmentDecisionSchema = z.object({
  appointmentId: z.string().min(1),
  decision: z.enum(["ACCEPT", "DECLINE"]),
  note: optionalString,
});
export type AppointmentDecisionInput = z.infer<typeof appointmentDecisionSchema>;
