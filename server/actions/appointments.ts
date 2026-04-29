"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireAuth } from "@/lib/auth-guard";
import {
  appointmentCreateSchema,
  appointmentDecisionSchema,
} from "@/schemas/appointment";
import {
  adminConfirmAppointment,
  adminMarkSentToContractor,
  createAppointment,
  decideAppointment,
} from "@/server/services/appointments";
import { approveAppointmentFee } from "@/server/services/billing";

function fd(formData: FormData) {
  const obj: Record<string, FormDataEntryValue> = {};
  for (const [k, v] of formData.entries()) obj[k] = v;
  return obj;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createAppointmentAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await requireAuth();
  const parsed = appointmentCreateSchema.safeParse(fd(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await createAppointment(ctx, parsed.data);
  revalidatePath(`/admin/leads/${parsed.data.leadId}`);
  revalidatePath(`/contractor/leads/${parsed.data.leadId}`);
  revalidatePath("/admin/appointments");
  revalidatePath("/contractor/appointments");
  return { ok: true };
}

export async function decideAppointmentAction(formData: FormData): Promise<void> {
  const ctx = await requireAuth();
  const parsed = appointmentDecisionSchema.safeParse(fd(formData));
  if (!parsed.success) return;
  await decideAppointment(ctx, parsed.data);
  revalidatePath("/admin/appointments");
  revalidatePath("/contractor/appointments");
}

export async function adminConfirmAppointmentAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  const id = String(formData.get("appointmentId"));
  await adminConfirmAppointment(ctx, id);
  revalidatePath("/admin/appointments");
}

export async function adminSendToContractorAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  const id = String(formData.get("appointmentId"));
  await adminMarkSentToContractor(ctx, id);
  revalidatePath("/admin/appointments");
}

export async function approveAppointmentFeeAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  const id = String(formData.get("appointmentId"));
  await approveAppointmentFee(ctx, { appointmentId: id });
  revalidatePath("/admin/billing");
  revalidatePath("/admin/appointments");
}
