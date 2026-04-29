"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { adSpendUpsertSchema } from "@/schemas/ad-spend";
import { upsertAdSpend, deleteAdSpend } from "@/server/services/ad-spend";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function upsertAdSpendAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  const parsed = adSpendUpsertSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await upsertAdSpend(ctx, parsed.data);
  revalidatePath("/admin/ad-spend");
  revalidatePath(`/admin/customers/${parsed.data.customerId}`);
  return { ok: true };
}

export async function deleteAdSpendAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  await deleteAdSpend(ctx, String(formData.get("id")));
  revalidatePath("/admin/ad-spend");
}
