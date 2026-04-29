import "server-only";
import { db } from "@/lib/db";
import { sendSms, isTwilioConfigured } from "@/lib/twilio";
import { SMS_TEMPLATES } from "@/lib/sms-templates";
import { writeAudit } from "./audit";
import { ForbiddenError, type AuthCtx } from "@/lib/auth-guard";
import { scopeToCustomer } from "@/lib/auth-guard";

function preview(body: string): string {
  return body.length > 200 ? body.slice(0, 200) + "..." : body;
}

function leadName(lead: { firstName: string | null; lastName: string | null }): string {
  return [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Lead";
}

function leadArea(lead: {
  address?: string | null;
  neighbourhood?: string | null;
  city?: string | null;
}): string {
  return [lead.address, lead.neighbourhood, lead.city].filter(Boolean).join(", ") || "your area";
}

async function activeTrackingNumber(customerId: string) {
  return db.trackingNumber.findFirst({
    where: { customerId, status: "ACTIVE" },
  });
}

export async function sendManualSmsToLead(
  ctx: AuthCtx,
  args: { leadId: string; body: string },
): Promise<{ providerMessageId: string; simulated: boolean }> {
  const lead = await db.lead.findUnique({ where: { id: args.leadId } });
  if (!lead) throw new Error("Lead not found");
  scopeToCustomer(ctx, lead.customerId);
  if (!lead.phone) throw new Error("Lead has no phone number");

  const tn = await activeTrackingNumber(lead.customerId);

  const result = await sendSms({
    to: lead.phone,
    body: args.body,
    from: tn?.twilioPhoneNumber,
  });

  await db.smsMessage.create({
    data: {
      customerId: lead.customerId,
      leadId: lead.id,
      fromNumber: tn?.twilioPhoneNumber ?? "+system",
      toNumber: lead.phone,
      body: args.body,
      direction: "OUTBOUND",
      providerMessageId: result.providerMessageId,
      status: result.status,
    },
  });
  await db.leadEvent.create({
    data: {
      leadId: lead.id,
      type: "SMS_OUT",
      description: preview(args.body),
      createdByUserId: ctx.userId,
      metadata: { simulated: result.simulated },
    },
  });
  await writeAudit({
    userId: ctx.userId,
    customerId: lead.customerId,
    action: "SMS_SENT",
    entityType: "Lead",
    entityId: lead.id,
    metadata: { simulated: result.simulated, messageId: result.providerMessageId },
  });

  return { providerMessageId: result.providerMessageId, simulated: result.simulated };
}

export async function requestLeadAvailability(args: {
  leadId: string;
}): Promise<{ sent: boolean; simulated: boolean }> {
  const lead = await db.lead.findUnique({
    where: { id: args.leadId },
    include: { customer: { select: { businessName: true } } },
  });
  if (!lead?.phone) return { sent: false, simulated: false };

  const alreadyAsked = await db.leadEvent.findFirst({
    where: { leadId: lead.id, type: "LEAD_AVAILABILITY_REQUESTED" },
  });
  if (alreadyAsked) return { sent: false, simulated: false };

  const tn = await activeTrackingNumber(lead.customerId);
  const body = SMS_TEMPLATES.leadAvailabilityRequest({
    firstName: lead.firstName,
    service: lead.serviceRequested,
    businessName: lead.customer.businessName,
  });
  const result = await sendSms({
    to: lead.phone,
    body,
    from: tn?.twilioPhoneNumber,
  });

  await db.$transaction(async (tx) => {
    await tx.smsMessage.create({
      data: {
        customerId: lead.customerId,
        leadId: lead.id,
        fromNumber: tn?.twilioPhoneNumber ?? "+system",
        toNumber: lead.phone!,
        body,
        direction: "OUTBOUND",
        providerMessageId: result.providerMessageId,
        status: result.status,
      },
    });
    await tx.leadEvent.create({
      data: {
        leadId: lead.id,
        type: "LEAD_AVAILABILITY_REQUESTED",
        description: "Asked lead for estimate availability by SMS",
        metadata: { simulated: result.simulated },
      },
    });
  });

  return { sent: true, simulated: result.simulated };
}

export async function notifyContractorOfNewLead(
  ctx: AuthCtx,
  args: { leadId: string; summaryFromAdmin?: string },
): Promise<{ ok: boolean; simulated: boolean } | { ok: false; error: string }> {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  const lead = await db.lead.findUnique({
    where: { id: args.leadId },
    include: {
      appointment: true,
      customer: { select: { forwardingPhone: true } },
    },
  });
  if (!lead) throw new Error("Lead not found");

  const tn = await activeTrackingNumber(lead.customerId);
  const summary =
    args.summaryFromAdmin ??
    SMS_TEMPLATES.contractorProposedTime({
      leadName: leadName(lead),
      service: lead.serviceRequested,
      cityOrNeighbourhood: leadArea(lead),
      preferredTime: lead.preferredTime,
      projectDetails: lead.projectDetails,
    });

  const result = await sendSms({
    to: lead.customer.forwardingPhone,
    body: summary,
    from: tn?.twilioPhoneNumber,
  });

  if (lead.appointment) {
    await db.appointment.update({
      where: { id: lead.appointment.id },
      data: {
        sentToContractorAt: lead.appointment.sentToContractorAt ?? new Date(),
        status:
          lead.appointment.status === "REQUESTED"
            ? "SENT_TO_CONTRACTOR"
            : lead.appointment.status,
      },
    });
  }
  await db.smsMessage.create({
    data: {
      customerId: lead.customerId,
      leadId: lead.id,
      fromNumber: tn?.twilioPhoneNumber ?? "+system",
      toNumber: lead.customer.forwardingPhone,
      body: summary,
      direction: "OUTBOUND",
      providerMessageId: result.providerMessageId,
      status: result.status,
    },
  });
  await db.leadEvent.create({
    data: {
      leadId: lead.id,
      type: "CONTRACTOR_NOTIFIED",
      description: "Contractor proposed-time SMS sent",
      createdByUserId: ctx.userId,
      metadata: { simulated: result.simulated },
    },
  });
  return { ok: true, simulated: result.simulated };
}

export async function recordLeadAvailabilityReply(args: {
  customerId: string;
  leadId: string;
  body: string;
}): Promise<{ contractorNotified: boolean; simulated: boolean }> {
  const cleanBody = args.body.trim();
  if (!cleanBody) return { contractorNotified: false, simulated: false };

  const lead = await db.lead.findFirst({
    where: { id: args.leadId, customerId: args.customerId, deletedAt: null },
    include: {
      appointment: true,
      customer: { select: { businessName: true, forwardingPhone: true } },
    },
  });
  if (!lead) return { contractorNotified: false, simulated: false };

  const tn = await activeTrackingNumber(lead.customerId);
  const contractorBody = SMS_TEMPLATES.contractorProposedTime({
    leadName: leadName(lead),
    service: lead.serviceRequested,
    cityOrNeighbourhood: leadArea(lead),
    preferredTime: cleanBody,
    projectDetails: lead.projectDetails,
  });
  const leadAck = SMS_TEMPLATES.leadAvailabilityReceived({ firstName: lead.firstName });

  const [contractorSms, leadSms] = await Promise.all([
    sendSms({
      to: lead.customer.forwardingPhone,
      body: contractorBody,
      from: tn?.twilioPhoneNumber,
    }),
    lead.phone
      ? sendSms({
          to: lead.phone,
          body: leadAck,
          from: tn?.twilioPhoneNumber,
        })
      : Promise.resolve({ providerMessageId: "no_lead_phone", status: "skipped", simulated: true }),
  ]);

  await db.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: lead.id },
      data: {
        preferredTime: cleanBody,
        status: lead.status === "NEW" ? "CONTACTED" : lead.status,
      },
    });
    const appt = lead.appointment
      ? await tx.appointment.update({
          where: { id: lead.appointment.id },
          data: {
            sentToContractorAt: lead.appointment.sentToContractorAt ?? new Date(),
            status:
              lead.appointment.status === "REQUESTED" || lead.appointment.status === "CONFIRMED"
                ? "SENT_TO_CONTRACTOR"
                : lead.appointment.status,
            notes: lead.appointment.notes
              ? `${lead.appointment.notes}\nLead availability: ${cleanBody}`
              : `Lead availability: ${cleanBody}`,
          },
        })
      : await tx.appointment.create({
          data: {
            leadId: lead.id,
            customerId: lead.customerId,
            status: "SENT_TO_CONTRACTOR",
            sentToContractorAt: new Date(),
            notes: `Lead availability: ${cleanBody}`,
          },
        });

    await tx.smsMessage.create({
      data: {
        customerId: lead.customerId,
        leadId: lead.id,
        fromNumber: tn?.twilioPhoneNumber ?? "+system",
        toNumber: lead.customer.forwardingPhone,
        body: contractorBody,
        direction: "OUTBOUND",
        providerMessageId: contractorSms.providerMessageId,
        status: contractorSms.status,
      },
    });
    if (lead.phone) {
      await tx.smsMessage.create({
        data: {
          customerId: lead.customerId,
          leadId: lead.id,
          fromNumber: tn?.twilioPhoneNumber ?? "+system",
          toNumber: lead.phone,
          body: leadAck,
          direction: "OUTBOUND",
          providerMessageId: leadSms.providerMessageId,
          status: leadSms.status,
        },
      });
    }
    await tx.leadEvent.createMany({
      data: [
        {
          leadId: lead.id,
          type: "LEAD_AVAILABILITY_RECEIVED",
          description: preview(cleanBody),
        },
        {
          leadId: lead.id,
          type: "CONTRACTOR_PROPOSED_TIME_SENT",
          description: `Appointment ${appt.id} sent to contractor for confirmation`,
          metadata: { simulated: contractorSms.simulated },
        },
      ],
    });
  });

  return {
    contractorNotified: true,
    simulated: contractorSms.simulated,
  };
}

export async function sendMissedCallTextBack(args: {
  customerId: string;
  callerPhone: string;
  trackingNumber: string;
  callSid: string;
}): Promise<{ sent: boolean; simulated: boolean; leadId?: string }> {
  const customer = await db.customer.findUnique({
    where: { id: args.customerId },
    select: { id: true, businessName: true },
  });
  if (!customer) return { sent: false, simulated: false };

  const existingEvent = await db.leadEvent.findFirst({
    where: {
      type: "MISSED_CALL_TEXT_BACK_SENT",
      metadata: { path: ["callSid"], equals: args.callSid },
    },
    select: { leadId: true },
  });
  if (existingEvent) {
    return { sent: false, simulated: false, leadId: existingEvent.leadId };
  }

  const lead =
    (await db.lead.findFirst({
      where: { customerId: args.customerId, phone: args.callerPhone, deletedAt: null },
      orderBy: { createdAt: "desc" },
    })) ??
    (await db.lead.create({
      data: {
        customerId: args.customerId,
        source: "TRACKING_PHONE_CALL",
        phone: args.callerPhone,
        status: "NEW",
      },
    }));

  const tn = await activeTrackingNumber(args.customerId);
  const body = SMS_TEMPLATES.missedCallTextBack({
    businessName: customer.businessName,
    service: lead.serviceRequested,
  });
  const result = await sendSms({
    to: args.callerPhone,
    body,
    from: tn?.twilioPhoneNumber ?? args.trackingNumber,
  });

  await db.$transaction(async (tx) => {
    await tx.callLog.updateMany({
      where: { callSid: args.callSid, customerId: args.customerId },
      data: { leadId: lead.id },
    });
    await tx.smsMessage.create({
      data: {
        customerId: args.customerId,
        leadId: lead.id,
        fromNumber: tn?.twilioPhoneNumber ?? args.trackingNumber,
        toNumber: args.callerPhone,
        body,
        direction: "OUTBOUND",
        providerMessageId: result.providerMessageId,
        status: result.status,
      },
    });
    await tx.leadEvent.create({
      data: {
        leadId: lead.id,
        type: "MISSED_CALL_TEXT_BACK_SENT",
        description: "Sent instant missed-call text-back",
        metadata: {
          callSid: args.callSid,
          trackingNumber: args.trackingNumber,
          simulated: result.simulated,
        },
      },
    });
    await tx.notification.create({
      data: {
        customerId: args.customerId,
        category: "LEAD",
        title: "Missed call text-back sent",
        message: `Caller ${args.callerPhone} received an automatic text-back after a missed call.`,
        link: `/admin/leads/${lead.id}`,
      },
    });
  });

  return { sent: true, simulated: result.simulated, leadId: lead.id };
}

export { isTwilioConfigured };
