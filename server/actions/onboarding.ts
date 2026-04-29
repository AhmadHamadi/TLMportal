"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import {
  onboardingCreateSchema,
  onboardingUpdateSchema,
} from "@/schemas/onboarding";
import {
  createItem,
  deleteItem,
  spawnDefaultChecklist,
  updateItem,
} from "@/server/services/onboarding";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createOnboardingItemAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  const parsed = onboardingCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await createItem(ctx, parsed.data);
  revalidatePath(`/admin/customers/${parsed.data.customerId}`);
  return { ok: true };
}

export async function updateOnboardingItemAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  const parsed = onboardingUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const item = await updateItem(ctx, parsed.data);
  revalidatePath(`/admin/customers/${item.customerId}`);
}

export async function deleteOnboardingItemAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  const id = String(formData.get("id"));
  const customerId = String(formData.get("customerId"));
  await deleteItem(ctx, id);
  if (customerId) revalidatePath(`/admin/customers/${customerId}`);
}

export async function spawnChecklistAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  const customerId = String(formData.get("customerId"));
  await spawnDefaultChecklist(ctx, customerId);
  revalidatePath(`/admin/customers/${customerId}`);
}
