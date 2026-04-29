"use server";

import { revalidatePath } from "next/cache";
import { ForbiddenError, requireAdmin } from "@/lib/auth-guard";
import { disputeCreateSchema, disputeReviewSchema } from "@/schemas/dispute";
import { fileDispute, reviewDispute, DisputeWindowError } from "@/server/services/disputes";

function fd(formData: FormData) {
  const obj: Record<string, FormDataEntryValue> = {};
  for (const [k, v] of formData.entries()) obj[k] = v;
  return obj;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function fileDisputeAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  const parsed = disputeCreateSchema.safeParse(fd(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    await fileDispute(ctx, parsed.data);
  } catch (err) {
    if (err instanceof DisputeWindowError) {
      return { ok: false, error: err.message };
    }
    if (err instanceof ForbiddenError) {
      return { ok: false, error: err.message };
    }
    throw err;
  }
  revalidatePath("/contractor/disputes");
  revalidatePath("/admin/disputes");
  revalidatePath("/contractor/appointments");
  return { ok: true };
}

export async function reviewDisputeAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  const parsed = disputeReviewSchema.safeParse(fd(formData));
  if (!parsed.success) return;
  await reviewDispute(ctx, parsed.data);
  revalidatePath("/admin/disputes");
  revalidatePath("/contractor/disputes");
}
