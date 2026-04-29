"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireAuth } from "@/lib/auth-guard";
import {
  leadBillableUpdateSchema,
  leadCreateSchema,
  leadStatusUpdateSchema,
} from "@/schemas/lead";
import {
  createLead,
  setLeadBillable,
  updateLeadStatus,
} from "@/server/services/leads";

export type ActionResult = { ok: true } | { ok: false; error: string };

function fd(formData: FormData) {
  const obj: Record<string, FormDataEntryValue> = {};
  for (const [k, v] of formData.entries()) obj[k] = v;
  return obj;
}

export async function createLeadAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  const parsed = leadCreateSchema.safeParse(fd(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const created = await createLead(ctx, parsed.data);
  revalidatePath("/admin/leads");
  redirect(`/admin/leads/${created.id}`);
}

export async function updateLeadStatusAction(formData: FormData): Promise<void> {
  const ctx = await requireAuth();
  const parsed = leadStatusUpdateSchema.safeParse(fd(formData));
  if (!parsed.success) return;
  await updateLeadStatus(ctx, parsed.data);
  revalidatePath(`/admin/leads/${parsed.data.leadId}`);
  revalidatePath("/admin/leads");
  revalidatePath(`/contractor/leads/${parsed.data.leadId}`);
  revalidatePath("/contractor/leads");
}

export async function setLeadBillableAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  const parsed = leadBillableUpdateSchema.safeParse(fd(formData));
  if (!parsed.success) return;
  await setLeadBillable(ctx, parsed.data);
  revalidatePath(`/admin/leads/${parsed.data.leadId}`);
  revalidatePath("/admin/leads");
}
