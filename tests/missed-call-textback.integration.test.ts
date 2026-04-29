import { afterAll, describe, expect, it, vi } from "vitest";
import { getSeededCustomers, testDb } from "./helpers";

let smsCounter = 0;

vi.mock("@/lib/twilio", () => ({
  isTwilioConfigured: () => false,
  sendSms: vi.fn(async () => {
    smsCounter += 1;
    return {
      providerMessageId: `missed_call_sms_${Date.now()}_${smsCounter}`,
      status: "simulated",
      simulated: true,
    };
  }),
}));

import { sendMissedCallTextBack } from "@/server/services/sms";

describe("missed-call text-back workflow", () => {
  afterAll(async () => {
    await testDb.$disconnect();
  });

  it("creates or attaches a lead and sends one text-back per call", async () => {
    const { atlas } = await getSeededCustomers();
    const callSid = `CA_test_${Date.now()}`;
    const callerPhone = "+14165550333";
    const trackingNumber = "+14165550999";

    await testDb.callLog.create({
      data: {
        callSid,
        customerId: atlas.id,
        fromNumber: callerPhone,
        toNumber: trackingNumber,
        trackingNumber,
        callStatus: "no-answer",
        direction: "INBOUND",
      },
    });

    try {
      const first = await sendMissedCallTextBack({
        customerId: atlas.id,
        callerPhone,
        trackingNumber,
        callSid,
      });
      const second = await sendMissedCallTextBack({
        customerId: atlas.id,
        callerPhone,
        trackingNumber,
        callSid,
      });

      expect(first.sent).toBe(true);
      expect(first.simulated).toBe(true);
      expect(first.leadId).toBeTruthy();
      expect(second.sent).toBe(false);
      expect(second.leadId).toBe(first.leadId);

      const lead = await testDb.lead.findUnique({ where: { id: first.leadId! } });
      expect(lead?.source).toBe("TRACKING_PHONE_CALL");
      expect(lead?.phone).toBe(callerPhone);

      const texts = await testDb.smsMessage.findMany({
        where: { leadId: first.leadId, direction: "OUTBOUND" },
      });
      expect(texts).toHaveLength(1);
      expect(texts[0].body).toContain("Sorry we missed your call");

      const call = await testDb.callLog.findUnique({ where: { callSid } });
      expect(call?.leadId).toBe(first.leadId);
    } finally {
      const lead = await testDb.lead.findFirst({
        where: { customerId: atlas.id, phone: callerPhone },
        orderBy: { createdAt: "desc" },
      });
      if (lead) {
        await testDb.smsMessage.deleteMany({ where: { leadId: lead.id } });
        await testDb.leadEvent.deleteMany({ where: { leadId: lead.id } });
        await testDb.notification.deleteMany({ where: { customerId: atlas.id, link: `/admin/leads/${lead.id}` } });
        await testDb.callLog.deleteMany({ where: { callSid } });
        await testDb.lead.delete({ where: { id: lead.id } });
      } else {
        await testDb.callLog.deleteMany({ where: { callSid } });
      }
    }
  });
});
