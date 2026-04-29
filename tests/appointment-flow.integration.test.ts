import { afterAll, describe, it, expect } from "vitest";
import {
  createAppointment,
  decideAppointment,
} from "@/server/services/appointments";
import { fileDispute, DisputeWindowError } from "@/server/services/disputes";
import { createLead } from "@/server/services/leads";
import { type AuthCtx } from "@/lib/auth-guard";
import { getSeededCustomers, getSeededUsers, testDb } from "./helpers";

describe("appointment + dispute flow (integration vs Neon)", () => {
  afterAll(async () => {
    await testDb.$disconnect();
  });

  it("ACCEPT path: lead + appointment → contractor accept → billable + dispute window set", async () => {
    const { admin, atlasUser } = await getSeededUsers();
    const { atlas } = await getSeededCustomers();
    const adminCtx: AuthCtx = { role: "ADMIN", userId: admin.id };
    const contractorCtx: AuthCtx = {
      role: "CONTRACTOR",
      userId: atlasUser.id,
      customerIds: [atlas.id],
    };

    const lead = await createLead(adminCtx, {
      customerId: atlas.id,
      source: "MANUAL_ADMIN_ENTRY",
      firstName: "Test",
      lastName: `Run-${Date.now()}`,
      phone: "+14165557777",
      email: null,
      city: "Mississauga",
      neighbourhood: null,
      address: null,
      serviceRequested: "Concrete driveway",
      projectDetails: null,
      estimatedProjectSize: null,
      preferredTime: null,
    });

    const appt = await createAppointment(adminCtx, {
      leadId: lead.id,
      appointmentWindowStart: new Date(Date.now() + 24 * 3600 * 1000),
      appointmentWindowEnd: null,
      notes: null,
    });
    expect(appt.status).toBe("REQUESTED");

    const accepted = await decideAppointment(contractorCtx, {
      appointmentId: appt.id,
      decision: "ACCEPT",
      note: null,
    });
    expect(accepted.status).toBe("ACCEPTED");
    expect(accepted.isBillable).toBe(true);
    expect(accepted.acceptedByContractorAt).not.toBeNull();
    expect(accepted.disputeWindowEndsAt).not.toBeNull();

    const updatedLead = await testDb.lead.findUnique({ where: { id: lead.id } });
    expect(updatedLead?.status).toBe("ACCEPTED_BY_CONTRACTOR");
    expect(updatedLead?.billableStatus).toBe("BILLABLE");

    // Filing a dispute inside the window should succeed
    const dispute = await fileDispute(contractorCtx, {
      appointmentId: appt.id,
      reason: "Spam or fake lead",
      details: "Test dispute",
    });
    expect(dispute.status).toBe("OPEN");

    const afterDispute = await testDb.lead.findUnique({ where: { id: lead.id } });
    expect(afterDispute?.status).toBe("DISPUTED");
    expect(afterDispute?.billableStatus).toBe("DISPUTED");

    // cleanup
    await testDb.dispute.deleteMany({ where: { appointmentId: appt.id } });
    await testDb.appointment.delete({ where: { id: appt.id } });
    await testDb.leadEvent.deleteMany({ where: { leadId: lead.id } });
    await testDb.lead.delete({ where: { id: lead.id } });
  });

  it("DECLINE path: not billable, lead status updates", async () => {
    const { admin, atlasUser } = await getSeededUsers();
    const { atlas } = await getSeededCustomers();
    const adminCtx: AuthCtx = { role: "ADMIN", userId: admin.id };
    const contractorCtx: AuthCtx = {
      role: "CONTRACTOR",
      userId: atlasUser.id,
      customerIds: [atlas.id],
    };

    const lead = await createLead(adminCtx, {
      customerId: atlas.id,
      source: "MANUAL_ADMIN_ENTRY",
      firstName: "Decline",
      lastName: `Run-${Date.now()}`,
      phone: "+14165558888",
      email: null,
      city: "Mississauga",
      neighbourhood: null,
      address: null,
      serviceRequested: "Patio",
      projectDetails: null,
      estimatedProjectSize: null,
      preferredTime: null,
    });
    const appt = await createAppointment(adminCtx, {
      leadId: lead.id,
      appointmentWindowStart: null,
      appointmentWindowEnd: null,
      notes: null,
    });
    const declined = await decideAppointment(contractorCtx, {
      appointmentId: appt.id,
      decision: "DECLINE",
      note: null,
    });
    expect(declined.status).toBe("DECLINED");
    expect(declined.isBillable).toBe(false);
    const updatedLead = await testDb.lead.findUnique({ where: { id: lead.id } });
    expect(updatedLead?.status).toBe("DECLINED_BY_CONTRACTOR");

    await testDb.appointment.delete({ where: { id: appt.id } });
    await testDb.leadEvent.deleteMany({ where: { leadId: lead.id } });
    await testDb.lead.delete({ where: { id: lead.id } });
  });

  it("Dispute window: contractor cannot dispute after window closes", async () => {
    const { admin, atlasUser } = await getSeededUsers();
    const { atlas } = await getSeededCustomers();
    const adminCtx: AuthCtx = { role: "ADMIN", userId: admin.id };
    const contractorCtx: AuthCtx = {
      role: "CONTRACTOR",
      userId: atlasUser.id,
      customerIds: [atlas.id],
    };

    const lead = await createLead(adminCtx, {
      customerId: atlas.id,
      source: "MANUAL_ADMIN_ENTRY",
      firstName: "Window",
      lastName: `Run-${Date.now()}`,
      phone: "+14165559999",
      email: null,
      city: "Mississauga",
      neighbourhood: null,
      address: null,
      serviceRequested: "Patio",
      projectDetails: null,
      estimatedProjectSize: null,
      preferredTime: null,
    });
    // Create appointment that was accepted 100h ago (well past 48h window)
    const longAgo = new Date(Date.now() - 100 * 3600 * 1000);
    const appt = await testDb.appointment.create({
      data: {
        leadId: lead.id,
        customerId: atlas.id,
        sentToContractorAt: longAgo,
        acceptedByContractorAt: longAgo,
        status: "ACCEPTED",
        isBillable: true,
        disputeWindowEndsAt: new Date(longAgo.getTime() + 48 * 3600 * 1000),
      },
    });

    await expect(
      fileDispute(contractorCtx, {
        appointmentId: appt.id,
        reason: "Other",
        details: "Past window",
      }),
    ).rejects.toBeInstanceOf(DisputeWindowError);

    await testDb.appointment.delete({ where: { id: appt.id } });
    await testDb.leadEvent.deleteMany({ where: { leadId: lead.id } });
    await testDb.lead.delete({ where: { id: lead.id } });
  });
});
