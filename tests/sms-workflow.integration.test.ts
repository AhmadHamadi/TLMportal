import { afterAll, describe, expect, it, vi } from "vitest";
import { getSeededCustomers, testDb } from "./helpers";

let smsCounter = 0;

vi.mock("@/lib/twilio", () => ({
  isTwilioConfigured: () => false,
  sendSms: vi.fn(async () => {
    smsCounter += 1;
    return {
      providerMessageId: `test_sms_${Date.now()}_${smsCounter}`,
      status: "simulated",
      simulated: true,
    };
  }),
}));

import { recordLeadAvailabilityReply, requestLeadAvailability } from "@/server/services/sms";

describe("SMS appointment coordination workflow", () => {
  afterAll(async () => {
    await testDb.$disconnect();
  });

  it("asks a new landing-page lead for availability once", async () => {
    const { atlas } = await getSeededCustomers();
    const lead = await testDb.lead.create({
      data: {
        customerId: atlas.id,
        source: "LANDING_PAGE_FORM",
        firstName: "Amina",
        phone: "+14165550111",
        city: "Mississauga",
        serviceRequested: "Concrete patio",
        status: "NEW",
      },
    });

    try {
      const first = await requestLeadAvailability({ leadId: lead.id });
      const second = await requestLeadAvailability({ leadId: lead.id });

      expect(first).toEqual({ sent: true, simulated: true });
      expect(second).toEqual({ sent: false, simulated: false });

      const asks = await testDb.leadEvent.count({
        where: { leadId: lead.id, type: "LEAD_AVAILABILITY_REQUESTED" },
      });
      expect(asks).toBe(1);
    } finally {
      await testDb.smsMessage.deleteMany({ where: { leadId: lead.id } });
      await testDb.leadEvent.deleteMany({ where: { leadId: lead.id } });
      await testDb.lead.delete({ where: { id: lead.id } });
    }
  });

  it("turns lead availability into a contractor confirmation request", async () => {
    const { atlas } = await getSeededCustomers();
    const lead = await testDb.lead.create({
      data: {
        customerId: atlas.id,
        source: "LANDING_PAGE_FORM",
        firstName: "Sam",
        lastName: "Patel",
        phone: "+14165550222",
        city: "Etobicoke",
        serviceRequested: "Driveway replacement",
        projectDetails: "Two-car driveway, old asphalt removal.",
        status: "NEW",
      },
    });

    try {
      const result = await recordLeadAvailabilityReply({
        customerId: atlas.id,
        leadId: lead.id,
        body: "Tuesday after 4pm or Wednesday morning",
      });

      expect(result).toEqual({ contractorNotified: true, simulated: true });

      const updatedLead = await testDb.lead.findUnique({ where: { id: lead.id } });
      expect(updatedLead?.preferredTime).toBe("Tuesday after 4pm or Wednesday morning");
      expect(updatedLead?.status).toBe("CONTACTED");

      const appointment = await testDb.appointment.findUnique({ where: { leadId: lead.id } });
      expect(appointment?.status).toBe("SENT_TO_CONTRACTOR");
      expect(appointment?.notes).toContain("Tuesday after 4pm");

      const outboundTexts = await testDb.smsMessage.count({
        where: { leadId: lead.id, direction: "OUTBOUND" },
      });
      expect(outboundTexts).toBe(2);

      const events = await testDb.leadEvent.findMany({
        where: { leadId: lead.id },
        select: { type: true },
      });
      expect(events.map((event) => event.type)).toEqual(
        expect.arrayContaining(["LEAD_AVAILABILITY_RECEIVED", "CONTRACTOR_PROPOSED_TIME_SENT"]),
      );
    } finally {
      await testDb.smsMessage.deleteMany({ where: { leadId: lead.id } });
      await testDb.appointment.deleteMany({ where: { leadId: lead.id } });
      await testDb.leadEvent.deleteMany({ where: { leadId: lead.id } });
      await testDb.lead.delete({ where: { id: lead.id } });
    }
  });
});
