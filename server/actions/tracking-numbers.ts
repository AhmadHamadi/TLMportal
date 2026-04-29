"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guard";
import {
  provisionTrackingNumber,
  releaseTrackingNumber,
} from "@/server/services/tracking-numbers";

const schema = z.object({
  customerId: z.string().min(1),
  forwardingPhoneNumber: z.string().min(1),
  label: z.string().optional(),
  areaCode: z.string().optional(),
  existingNumber: z.string().optional(),
});

export type ActionResult =
  | { ok: true; simulated?: boolean }
  | { ok: false; error: string };

export async function provisionTrackingNumberAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const r = await provisionTrackingNumber(ctx, parsed.data);
    revalidatePath(`/admin/customers/${parsed.data.customerId}`);
    revalidatePath("/admin/tracking-numbers");
    return { ok: true, simulated: r.simulated };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function releaseTrackingNumberAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  const id = String(formData.get("id"));
  const customerId = String(formData.get("customerId"));
  await releaseTrackingNumber(ctx, id);
  if (customerId) revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/tracking-numbers");
}
