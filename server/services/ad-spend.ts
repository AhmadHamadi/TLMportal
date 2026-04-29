import "server-only";
import { db } from "@/lib/db";
import { writeAudit } from "./audit";
import { ForbiddenError, type AuthCtx } from "@/lib/auth-guard";
import type { AdSpendUpsertInput } from "@/schemas/ad-spend";

export async function upsertAdSpend(ctx: AuthCtx, input: AdSpendUpsertInput) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  const row = await db.googleAdsSpend.upsert({
    where: { customerId_month: { customerId: input.customerId, month: input.month } },
    create: {
      customerId: input.customerId,
      month: input.month,
      spendAmount: input.spendAmount,
      impressions: input.impressions,
      clicks: input.clicks,
      conversions: input.conversions,
      notes: input.notes,
    },
    update: {
      spendAmount: input.spendAmount,
      impressions: input.impressions,
      clicks: input.clicks,
      conversions: input.conversions,
      notes: input.notes,
    },
  });
  await writeAudit({
    userId: ctx.userId,
    customerId: input.customerId,
    action: "AD_SPEND_UPSERTED",
    entityType: "GoogleAdsSpend",
    entityId: row.id,
    metadata: { month: input.month, amount: input.spendAmount },
  });
  return row;
}

export async function deleteAdSpend(ctx: AuthCtx, id: string) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  return db.googleAdsSpend.delete({ where: { id } });
}
