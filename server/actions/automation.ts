"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { automationRuleCreateSchema } from "@/schemas/automation";
import { createRule, deleteRule, toggleRule } from "@/server/services/automation";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createRuleAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  const parsed = automationRuleCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await createRule(ctx, parsed.data);
  revalidatePath("/admin/automation");
  return { ok: true };
}

export async function toggleRuleAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  await toggleRule(ctx, String(formData.get("id")));
  revalidatePath("/admin/automation");
}

export async function deleteRuleAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  await deleteRule(ctx, String(formData.get("id")));
  revalidatePath("/admin/automation");
}
