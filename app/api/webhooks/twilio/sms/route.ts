import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyTwilioSignature, sendSms } from "@/lib/twilio";
import { parseContractorReply } from "@/lib/sms-parser";
import { SMS_TEMPLATES } from "@/lib/sms-templates";

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

  // Match by tracking number, then contractor forwarding number
  const tn = await db.trackingNumber.findUnique({
    where: { twilioPhoneNumber: to },
    include: { customer: { select: { id: true, forwardingPhone: true } } },
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

  // Idempotent log
  await db.smsMessage.upsert({
    where: { providerMessageId: messageSid },
    create: {
      providerMessageId: messageSid,
      customerId,
      fromNumber: from,
      toNumber: to,
      body,
      direction: "INBOUND",
      status: "received",
    },
    update: {},
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
          customer: { select: { disputeWindowHours: true } },
        },
      });
      if (recent) {
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
            await sendSms({
              to: recent.lead.phone,
              body: SMS_TEMPLATES.leadConfirmation({
                firstName: recent.lead.firstName ?? "there",
              }),
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
        } else if (reply === "BAD") {
          await db.$transaction(async (tx) => {
            await tx.dispute.create({
              data: {
                leadId: recent.leadId,
                appointmentId: recent.id,
                customerId,
                reason: "Contractor flagged via SMS (BAD)",
                details: body,
                status: "OPEN",
              },
            });
            await tx.lead.update({
              where: { id: recent.leadId },
              data: { status: "DISPUTED", billableStatus: "DISPUTED" },
            });
            await tx.leadEvent.create({
              data: {
                leadId: recent.leadId,
                type: "DISPUTE_OPENED",
                description: "Contractor BAD reply opened dispute",
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

  return twiml();
}
