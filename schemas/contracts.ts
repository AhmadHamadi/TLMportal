import { z } from "zod";
import { optionalString } from "./shared";

export const CONTRACT_TYPES = [
  "MASTER_SERVICE_AGREEMENT",
  "SCOPE_LANDING_PAGE",
  "SCOPE_FULL_WEBSITE",
  "SCOPE_SEO",
  "SCOPE_GOOGLE_ADS_MANAGEMENT",
  "SCOPE_GBP_MANAGEMENT",
  "PAYMENT_AUTHORIZATION",
  "OTHER",
] as const;

export const CONTRACT_STATUSES = ["DRAFT", "SENT", "SIGNED", "EXPIRED", "TERMINATED"] as const;

export const contractCreateSchema = z.object({
  customerId: z.string().min(1),
  type: z.enum(CONTRACT_TYPES),
  name: z.string().min(2),
  fileUrl: z.string().url("Paste a public/shared URL (Drive, Dropbox, S3, etc.)"),
  status: z.enum(CONTRACT_STATUSES).default("DRAFT"),
  signerName: optionalString,
  signerEmail: optionalString,
  notes: optionalString,
});
export type ContractCreateInput = z.infer<typeof contractCreateSchema>;

export const contractUpdateStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(CONTRACT_STATUSES),
  signedAt: z.string().optional(),
});
export type ContractUpdateStatusInput = z.infer<typeof contractUpdateStatusSchema>;
