import { z } from "zod";
import { optionalString } from "./shared";

export const DISPUTE_REASONS = [
  "Spam or fake lead",
  "Wrong number / unreachable",
  "Outside service area",
  "Service we do not offer",
  "Below minimum project size",
  "Existing customer / already in our system",
  "Lead cancelled before confirmation",
  "Other",
] as const;

export const disputeCreateSchema = z.object({
  appointmentId: z.string().min(1),
  reason: z.string().min(1),
  details: optionalString,
});
export type DisputeCreateInput = z.infer<typeof disputeCreateSchema>;

export const disputeReviewSchema = z.object({
  disputeId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  decisionNote: optionalString,
});
export type DisputeReviewInput = z.infer<typeof disputeReviewSchema>;
