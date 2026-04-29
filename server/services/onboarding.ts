import "server-only";
import { db } from "@/lib/db";
import { writeAudit } from "./audit";
import { ForbiddenError, scopeToCustomer, type AuthCtx } from "@/lib/auth-guard";
import type {
  OnboardingCreateInput,
  OnboardingUpdateInput,
} from "@/schemas/onboarding";
import { ONBOARDING_PRESETS } from "@/schemas/onboarding";
import type { OnboardingItemType } from "@prisma/client";

export async function listOnboardingItems(ctx: AuthCtx, customerId: string) {
  scopeToCustomer(ctx, customerId);
  return db.onboardingItem.findMany({
    where: { customerId },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });
}

export async function createItem(ctx: AuthCtx, input: OnboardingCreateInput) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  const item = await db.onboardingItem.create({
    data: {
      customerId: input.customerId,
      type: input.type,
      title: input.title,
      prompt: input.prompt,
      notes: input.notes,
      status: input.status,
    },
  });
  await writeAudit({
    userId: ctx.userId,
    customerId: input.customerId,
    action: "ONBOARDING_ITEM_CREATED",
    entityType: "OnboardingItem",
    entityId: item.id,
    metadata: { type: input.type },
  });
  return item;
}

export async function updateItem(ctx: AuthCtx, input: OnboardingUpdateInput) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  return db.onboardingItem.update({
    where: { id: input.id },
    data: {
      status: input.status,
      prompt: input.prompt ?? undefined,
      notes: input.notes ?? undefined,
      completedAt: input.status === "DONE" ? new Date() : null,
    },
  });
}

export async function deleteItem(ctx: AuthCtx, id: string) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  return db.onboardingItem.delete({ where: { id } });
}

/**
 * Spawn a default onboarding checklist for a customer using the preset
 * prompts. Skips items already present (matched by type).
 */
export async function spawnDefaultChecklist(ctx: AuthCtx, customerId: string) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  const existing = await db.onboardingItem.findMany({
    where: { customerId },
    select: { type: true },
  });
  const have = new Set(existing.map((e) => e.type));
  const cust = await db.customer.findUnique({ where: { id: customerId } });
  if (!cust) throw new Error("Customer not found");

  const subs: Record<string, string> = {
    "{{businessName}}": cust.businessName,
    "{{industry}}": cust.industry ?? "general contractor",
    "{{forwardingPhone}}": cust.forwardingPhone,
    "{{monthlyAdBudget}}": cust.monthlyAdBudget.toString(),
  };
  function fill(s: string): string {
    let out = s;
    for (const [k, v] of Object.entries(subs)) {
      out = out.split(k).join(v);
    }
    return out;
  }

  const created: { type: OnboardingItemType; title: string }[] = [];
  for (const [type, preset] of Object.entries(ONBOARDING_PRESETS)) {
    if (type === "OTHER") continue;
    if (have.has(type as OnboardingItemType)) continue;
    await db.onboardingItem.create({
      data: {
        customerId,
        type: type as OnboardingItemType,
        title: preset.title,
        prompt: fill(preset.prompt),
        status: "TODO",
      },
    });
    created.push({ type: type as OnboardingItemType, title: preset.title });
  }
  await writeAudit({
    userId: ctx.userId,
    customerId,
    action: "ONBOARDING_CHECKLIST_SPAWNED",
    entityType: "Customer",
    entityId: customerId,
    metadata: { count: created.length },
  });
  return created;
}
