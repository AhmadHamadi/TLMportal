import "server-only";
import { db } from "@/lib/db";
import { sendSms, isTwilioConfigured } from "@/lib/twilio";
import { writeAudit } from "./audit";
import { ForbiddenError, type AuthCtx } from "@/lib/auth-guard";
import { scopeToCustomer } from "@/lib/auth-guard";

export async function sendManualSmsToLead(
  ctx: AuthCtx,
  args: { leadId: string; body: string },
): Promise<{ providerMessageId: string; simulated: boolean }> {
  const lead = await db.lead.findUnique({ where: { id: args.leadId } });
  if (!lead) throw new Error("Lead not found");
  scopeToCustomer(ctx, lead.customerId);
  if (!lead.phone) throw new Error("Lead has no phone number");

  const tn = await db.trackingNumber.findFirst({
    where: { customerId: lead.customerId, status: "ACTIVE" },
  });

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
      description: args.body.length > 200 ? args.body.slice(0, 200) + "..." : args.body,
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

  const tn = await db.trackingNumber.findFirst({
    where: { customerId: lead.customerId, status: "ACTIVE" },
  });
  const summary =
    args.summaryFromAdmin ??
    `New estimate request for ${lead.serviceRequested ?? "a project"} in ${lead.city ?? "your area"}. Preferred time: ${lead.preferredTime ?? "flexible"}. Project notes: ${lead.projectDetails ?? ""}. Reply YES to accept, NO to decline, BUSY for another time, or BAD to dispute.`;

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
      description: "Contractor summary SMS sent",
      createdByUserId: ctx.userId,
      metadata: { simulated: result.simulated },
    },
  });
  return { ok: true, simulated: result.simulated };
}

export { isTwilioConfigured };
