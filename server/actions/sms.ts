"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireAuth } from "@/lib/auth-guard";
import { sendManualSmsToLead, notifyContractorOfNewLead } from "@/server/services/sms";

export type ActionResult = { ok: true; simulated?: boolean } | { ok: false; error: string };

const sendSchema = z.object({
  leadId: z.string().min(1),
  body: z.string().min(1, "Message is required").max(1500),
});

export async function sendManualSmsAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await requireAuth();
  const parsed = sendSchema.safeParse({
    leadId: formData.get("leadId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const r = await sendManualSmsToLead(ctx, parsed.data);
    revalidatePath(`/admin/leads/${parsed.data.leadId}`);
    revalidatePath(`/contractor/leads/${parsed.data.leadId}`);
    return { ok: true, simulated: r.simulated };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Send failed" };
  }
}

export async function notifyContractorAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  const leadId = String(formData.get("leadId"));
  await notifyContractorOfNewLead(ctx, { leadId });
  revalidatePath(`/admin/leads/${leadId}`);
}
