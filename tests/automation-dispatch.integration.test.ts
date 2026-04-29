import { afterAll, afterEach, describe, expect, it } from "vitest";
import { dispatch } from "@/server/services/automation";
import { createLead } from "@/server/services/leads";
import { type AuthCtx } from "@/lib/auth-guard";
import { getSeededCustomers, getSeededUsers, testDb } from "./helpers";

describe("automation dispatch (integration vs Neon)", () => {
  afterAll(async () => {
    await testDb.$disconnect();
  });

  it("fires SEND_SMS rules on LEAD_CREATED with simulated Twilio", async () => {
    const { admin } = await getSeededUsers();
    const { atlas } = await getSeededCustomers();
    const adminCtx: AuthCtx = { role: "ADMIN", userId: admin.id };

    const rule = await testDb.automationRule.create({
      data: {
        customerId: atlas.id,
        name: "Test welcome SMS",
        trigger: "LEAD_CREATED",
        action: { type: "SEND_SMS", template: "Hi {{firstName}}!" },
        isActive: true,
      },
    });

    const lead = await createLead(adminCtx, {
      customerId: atlas.id,
      source: "MANUAL_ADMIN_ENTRY",
      firstName: "AutomationTest",
      lastName: `Run-${Date.now()}`,
      phone: "+14165554444",
      email: null,
      city: "Mississauga",
      neighbourhood: null,
      address: null,
      serviceRequested: "Concrete driveway",
      projectDetails: null,
      estimatedProjectSize: null,
      preferredTime: null,
    });

    // dispatch is fired-and-forgotten in createLead; call directly to assert
    const result = await dispatch({
      trigger: "LEAD_CREATED",
      customerId: atlas.id,
      leadId: lead.id,
    });
    expect(result.fired).toBeGreaterThanOrEqual(1);

    const sms = await testDb.smsMessage.findFirst({
      where: { leadId: lead.id, direction: "OUTBOUND" },
    });
    expect(sms).not.toBeNull();
    expect(sms!.body).toContain("AutomationTest");

    // cleanup
    await testDb.automationRule.delete({ where: { id: rule.id } });
    await testDb.smsMessage.deleteMany({ where: { leadId: lead.id } });
    await testDb.leadEvent.deleteMany({ where: { leadId: lead.id } });
    await testDb.lead.delete({ where: { id: lead.id } });
  });

  it("does not fire when rule isActive=false", async () => {
    const { atlas } = await getSeededCustomers();
    const rule = await testDb.automationRule.create({
      data: {
        customerId: atlas.id,
        name: "Inactive rule",
        trigger: "LEAD_CREATED",
        action: { type: "NOTIFY_ADMIN", title: "x", message: "x" },
        isActive: false,
      },
    });
    const result = await dispatch({
      trigger: "LEAD_CREATED",
      customerId: atlas.id,
    });
    expect(result.fired).toBe(0);
    await testDb.automationRule.delete({ where: { id: rule.id } });
  });

  afterEach(async () => {
    await testDb.notification.deleteMany({ where: { title: "x" } });
  });
});
