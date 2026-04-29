"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guard";
import { sendPortalInvite } from "@/server/services/notifications";

export type ActionResult = { ok: true; simulated?: boolean } | { ok: false; error: string };

const inviteSchema = z.object({
  userId: z.string().min(1),
  tempPassword: z.string().min(1),
});

export async function sendPortalInviteAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const r = await sendPortalInvite(ctx, parsed.data);
    revalidatePath("/admin/customers");
    return { ok: true, simulated: r.simulated };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}
