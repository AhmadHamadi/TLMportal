import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyTwilioSignature, sendSms } from "@/lib/twilio";
import { parseContractorReply } from "@/lib/sms-parser";
import { SMS_TEMPLATES } from "@/lib/sms-templates";
import { recordLeadAvailabilityReply } from "@/server/services/sms";

export const runtime = "nodejs";

function twiml(body = ""): NextResponse {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const url = req.url;
  const params = Object.fromEntries(await req.formData()) as Record<string, string>;
  const sig = req.headers.get("x-twilio-signature");

  if (!verifyTwilioSignature(sig, url, params)) {
    return new NextResponse("invalid signature", { status: 403 });
  }

  const messageSid = params.MessageSid ?? params.SmsMessageSid;
  const from = params.From;
  const to = params.To;
  const body = params.Body ?? "";
  if (!messageSid || !from || !to) return twiml();

  // Match by tracking number, then contractor forwarding number
  const tn = await db.trackingNumber.findUnique({
    where: { twilioPhoneNumber: to },
    include: { customer: { select: { id: true, businessName: true, forwardingPhone: true } } },
  });

  let customerId = tn?.customerId;
  let isContractorReply = false;
  if (tn && from === tn.forwardingPhoneNumber) isContractorReply = true;
  if (!customerId) {
    const fromContractor = await db.customer.findFirst({
      where: { forwardingPhone: from },
      select: { id: true },
    });
    if (fromContractor) {
      customerId = fromContractor.id;
      isContractorReply = true;
    }
  }
  if (!customerId) return twiml();

  // Twilio can retry webhooks. Return success for duplicates without repeating side effects.
  const alreadyHandled = await db.smsMessage.findUnique({
    where: { providerMessageId: messageSid },
    select: { id: true },
  });
  if (alreadyHandled) return twiml();

  await db.smsMessage.create({
    data: {
      providerMessageId: messageSid,
      customerId,
      fromNumber: from,
      toNumber: to,
      body,
      direction: "INBOUND",
      status: "received",
    },
  });

  if (isContractorReply) {
    const reply = parseContractorReply(body);
    if (reply) {
      const recent = await db.appointment.findFirst({
        where: {
          customerId,
          status: { in: ["REQUESTED", "SENT_TO_CONTRACTOR", "CONFIRMED"] },
        },
        orderBy: { createdAt: "desc" },
        include: {
          lead: true,
          customer: { select: { businessName: true, disputeWindowHours: true } },
        },
      });
      if (recent) {
        await db.smsMessage.update({
          where: { providerMessageId: messageSid },
          data: { leadId: recent.leadId },
        });
        const now = new Date();
        if (reply === "YES") {
          await db.$transaction(async (tx) => {
            await tx.appointment.update({
              where: { id: recent.id },
              data: {
                status: "ACCEPTED",
                acceptedByContractorAt: now,
                isBillable: true,
                disputeWindowEndsAt: new Date(
                  now.getTime() + recent.customer.disputeWindowHours * 3600 * 1000,
                ),
              },
            });
            await tx.lead.update({
              where: { id: recent.leadId },
              data: { status: "ACCEPTED_BY_CONTRACTOR", billableStatus: "BILLABLE" },
            });
            await tx.leadEvent.create({
              data: {
                leadId: recent.leadId,
                type: "CONTRACTOR_REPLY_YES",
                description: "Contractor accepted via SMS",
              },
            });
          });
          if (recent.lead.phone) {
            const confirmation = await sendSms({
              to: recent.lead.phone,
              body: SMS_TEMPLATES.leadAppointmentConfirmed({
                firstName: recent.lead.firstName,
                businessName: recent.customer.businessName,
                preferredTime: recent.lead.preferredTime,
              }),
              from: tn?.twilioPhoneNumber,
            });
            await db.smsMessage.create({
              data: {
                customerId,
                leadId: recent.leadId,
                fromNumber: tn?.twilioPhoneNumber ?? "+system",
                toNumber: recent.lead.phone,
                body: SMS_TEMPLATES.leadAppointmentConfirmed({
                  firstName: recent.lead.firstName,
                  businessName: recent.customer.businessName,
                  preferredTime: recent.lead.preferredTime,
                }),
                direction: "OUTBOUND",
                providerMessageId: confirmation.providerMessageId,
                status: confirmation.status,
              },
            });
          }
        } else if (reply === "NO") {
          await db.$transaction(async (tx) => {
            await tx.appointment.update({
              where: { id: recent.id },
              data: { status: "DECLINED", isBillable: false },
            });
            await tx.lead.update({
              where: { id: recent.leadId },
              data: { status: "DECLINED_BY_CONTRACTOR" },
            });
            await tx.leadEvent.create({
              data: {
                leadId: recent.leadId,
                type: "CONTRACTOR_REPLY_NO",
                description: "Contractor declined via SMS",
              },
            });
          });
        } else if (reply === "BUSY") {
          await db.leadEvent.create({
            data: {
              leadId: recent.leadId,
              type: "CONTRACTOR_REPLY_BUSY",
              description: "Contractor busy — admin to reschedule",
            },
          });
          await db.notification.create({
            data: {
              customerId,
              category: "LEAD",
              title: "Contractor BUSY reply — needs reschedule",
              message: `Lead ${recent.leadId} needs a new time slot.`,
              link: `/admin/leads/${recent.leadId}`,
            },
          });
          if (recent.lead.phone) {
            const alternativeBody = SMS_TEMPLATES.leadAlternativeTimeNeeded({
              firstName: recent.lead.firstName,
              businessName: recent.customer.businessName,
            });
            const alternative = await sendSms({
              to: recent.lead.phone,
              body: alternativeBody,
              from: tn?.twilioPhoneNumber,
            });
            await db.smsMessage.create({
              data: {
                customerId,
                leadId: recent.leadId,
                fromNumber: tn?.twilioPhoneNumber ?? "+system",
                toNumber: recent.lead.phone,
                body: alternativeBody,
                direction: "OUTBOUND",
                providerMessageId: alternative.providerMessageId,
                status: alternative.status,
              },
            });
          }
        } else if (reply === "BAD") {
          await db.$transaction(async (tx) => {
            await tx.leadEvent.create({
              data: {
                leadId: recent.leadId,
                type: "LEAD_REVIEW_REQUESTED",
                description: "Contractor replied BAD by SMS; admin review required before any billing change",
                metadata: { appointmentId: recent.id, body },
              },
            });
            await tx.notification.create({
              data: {
                customerId,
                category: "DISPUTE",
                title: "Lead review requested by SMS",
                message: `Contractor replied BAD for lead ${recent.leadId}. Review evidence before changing billing.`,
                link: `/admin/leads/${recent.leadId}`,
              },
            });
          });
        }
      }
    }
    return twiml();
  }

  // Non-contractor inbound — best-effort attach to existing lead by phone or create a new SMS_REPLY lead
  const existingLead = await db.lead.findFirst({
    where: { customerId, phone: from, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  let leadId = existingLead?.id;
  if (!existingLead) {
    const created = await db.lead.create({
      data: {
        customerId,
        source: "SMS_REPLY",
        phone: from,
        status: "NEW",
        firstName: null,
      },
    });
    leadId = created.id;
  }
  await db.smsMessage.update({
    where: { providerMessageId: messageSid },
    data: { leadId },
  });
  await db.leadEvent.create({
    data: {
      leadId: leadId!,
      type: "SMS_IN",
      description: body.length > 200 ? body.slice(0, 200) + "..." : body,
    },
  });
  await recordLeadAvailabilityReply({
    customerId,
    leadId: leadId!,
    body,
  });

  return twiml();
}
