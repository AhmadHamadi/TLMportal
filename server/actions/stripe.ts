"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import {
  ensureStripeCustomer,
  startMonthlySubscription,
  pushBillingRecordToStripe,
  StripeNotConfiguredError,
} from "@/server/services/stripe";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function startSubscriptionAction(formData: FormData): Promise<ActionResult> {
  const ctx = await requireAdmin();
  const customerId = String(formData.get("customerId"));
  try {
    await startMonthlySubscription(ctx, customerId);
    revalidatePath(`/admin/customers/${customerId}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) {
      return { ok: false, error: err.message };
    }
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function ensureStripeCustomerAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  const customerId = String(formData.get("customerId"));
  await ensureStripeCustomer(ctx, customerId);
  revalidatePath(`/admin/customers/${customerId}`);
}

export async function pushBillingRecordAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  const id = String(formData.get("id"));
  await pushBillingRecordToStripe(ctx, id);
  revalidatePath("/admin/billing");
}
