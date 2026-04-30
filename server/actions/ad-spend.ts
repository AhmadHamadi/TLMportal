"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireContractor, scopeToCustomer } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { adBudgetRequestSchema, adSpendUpsertSchema } from "@/schemas/ad-spend";
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

export async function requestAdBudgetChangeAction(formData: FormData): Promise<void> {
  const ctx = await requireContractor();
  const parsed = adBudgetRequestSchema.parse(Object.fromEntries(formData));

  scopeToCustomer(ctx, parsed.customerId);
  const customer = await db.customer.findUnique({
    where: { id: parsed.customerId },
    select: { businessName: true, monthlyAdBudget: true, googleAdsBudgetCurrency: true },
  });
  if (!customer) return;

  await db.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id: parsed.customerId },
      data: { googleAdsBudgetCurrency: parsed.currency },
    });
    await tx.notification.create({
      data: {
        customerId: parsed.customerId,
        category: "SYSTEM",
        title: "Google Ads budget change request",
        message: `${customer.businessName} requested to ${parsed.direction} Google Ads spend from ${customer.googleAdsBudgetCurrency} ${customer.monthlyAdBudget.toString()} to ${parsed.currency} ${parsed.requestedBudget.toFixed(2)} for the next 30 days.${parsed.note ? ` Note: ${parsed.note}` : ""}`,
        link: `/admin/customers/${parsed.customerId}`,
      },
    });
  });
  revalidatePath("/contractor");
  revalidatePath("/admin");
}
