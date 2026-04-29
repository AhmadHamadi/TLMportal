"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import {
  contractCreateSchema,
  contractUpdateStatusSchema,
} from "@/schemas/contracts";
import {
  createContract,
  deleteContract,
  updateContractStatus,
} from "@/server/services/contracts";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createContractAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  const parsed = contractCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await createContract(ctx, parsed.data);
  revalidatePath(`/admin/customers/${parsed.data.customerId}`);
  return { ok: true };
}

export async function updateContractStatusAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  const parsed = contractUpdateStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const r = await updateContractStatus(ctx, parsed.data);
  revalidatePath(`/admin/customers/${r.customerId}`);
}

export async function deleteContractAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  const id = String(formData.get("id"));
  const customerId = String(formData.get("customerId"));
  await deleteContract(ctx, id);
  if (customerId) revalidatePath(`/admin/customers/${customerId}`);
}
