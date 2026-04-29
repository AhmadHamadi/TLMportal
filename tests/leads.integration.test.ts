import { afterAll, describe, it, expect } from "vitest";
import { listLeads, getLead } from "@/server/services/leads";
import { ForbiddenError, type AuthCtx } from "@/lib/auth-guard";
import { getSeededCustomers, getSeededUsers, testDb } from "./helpers";

describe("leads service (integration vs Neon)", () => {
  afterAll(async () => {
    await testDb.$disconnect();
  });

  it("admin sees leads from all customers", async () => {
    const { admin } = await getSeededUsers();
    const ctx: AuthCtx = { role: "ADMIN", userId: admin.id };
    const { items, total } = await listLeads(ctx, { page: 1 });
    expect(total).toBeGreaterThan(0);
    const customerIds = new Set(items.map((l) => l.customerId));
    expect(customerIds.size).toBeGreaterThanOrEqual(2);
  });

  it("contractor sees only their own customer's leads", async () => {
    const { atlasUser } = await getSeededUsers();
    const { atlas, northside } = await getSeededCustomers();
    const ctx: AuthCtx = {
      role: "CONTRACTOR",
      userId: atlasUser.id,
      customerIds: [atlas.id],
    };
    const { items } = await listLeads(ctx, { page: 1 });
    expect(items.length).toBeGreaterThan(0);
    for (const lead of items) {
      expect(lead.customerId).toBe(atlas.id);
      expect(lead.customerId).not.toBe(northside.id);
    }
  });

  it("contractor cannot read another customer's lead by id", async () => {
    const { atlasUser } = await getSeededUsers();
    const { atlas, northside } = await getSeededCustomers();
    const someoneElsesLead = await testDb.lead.findFirst({
      where: { customerId: northside.id },
    });
    expect(someoneElsesLead).not.toBeNull();
    const ctx: AuthCtx = {
      role: "CONTRACTOR",
      userId: atlasUser.id,
      customerIds: [atlas.id],
    };
    await expect(getLead(ctx, someoneElsesLead!.id)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("contractor cannot override tenant scope with a customer filter", async () => {
    const { atlasUser } = await getSeededUsers();
    const { atlas, northside } = await getSeededCustomers();
    const ctx: AuthCtx = {
      role: "CONTRACTOR",
      userId: atlasUser.id,
      customerIds: [atlas.id],
    };
    await expect(
      listLeads(ctx, { customerId: northside.id, page: 1 }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("contractor with empty customerIds sees nothing", async () => {
    const ctx: AuthCtx = { role: "CONTRACTOR", userId: "x", customerIds: [] };
    const { items, total } = await listLeads(ctx, { page: 1 });
    expect(items).toHaveLength(0);
    expect(total).toBe(0);
  });
});
