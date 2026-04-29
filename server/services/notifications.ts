import "server-only";
import { db } from "@/lib/db";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { EmailTemplates } from "@/lib/email-templates";
import { sendSms } from "@/lib/twilio";
import { env } from "@/lib/env";
import { writeAudit } from "./audit";
import { ForbiddenError, type AuthCtx } from "@/lib/auth-guard";

export async function sendPortalInvite(
  ctx: AuthCtx,
  args: { userId: string; tempPassword: string },
): Promise<{ ok: boolean; simulated: boolean }> {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();

  const user = await db.user.findUnique({ where: { id: args.userId } });
  if (!user) throw new Error("User not found");

  const tpl = EmailTemplates.portalInvite({
    name: user.name ?? user.email,
    email: user.email,
    tempPassword: args.tempPassword,
    portalUrl: `${env.APP_URL}/login`,
  });
  const result = await sendEmail({ to: user.email, subject: tpl.subject, html: tpl.html });

  await writeAudit({
    userId: ctx.userId,
    customerId: null,
    action: "PORTAL_INVITE_SENT",
    entityType: "User",
    entityId: user.id,
    metadata: { simulated: result.simulated, emailConfigured: isEmailConfigured() },
  });
  return { ok: true, simulated: result.simulated };
}

export async function notifyContractorOfNewLead(
  args: { leadId: string; alsoSms?: boolean },
): Promise<{ emailSent: boolean; smsSent: boolean; simulatedEmail: boolean; simulatedSms: boolean }> {
  const lead = await db.lead.findUnique({
    where: { id: args.leadId },
    include: {
      customer: {
        select: {
          businessName: true,
          email: true,
          forwardingPhone: true,
          contactName: true,
          users: {
            include: { user: { select: { email: true, name: true } } },
          },
        },
      },
    },
  });
  if (!lead) return { emailSent: false, smsSent: false, simulatedEmail: false, simulatedSms: false };

  const recipientEmail =
    lead.customer.users.find((u) => Boolean(u.user.email))?.user.email ??
    lead.customer.email;

  const tpl = EmailTemplates.newLeadAlert({
    contractorName: lead.customer.contactName.split(" ")[0] ?? lead.customer.businessName,
    leadName:
      [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "A new lead",
    service: lead.serviceRequested ?? "an estimate",
    cityOrArea: [lead.city, lead.neighbourhood].filter(Boolean).join(", ") || "your service area",
    preferredTime: lead.preferredTime ?? "flexible",
    leadUrl: `${env.APP_URL}/contractor/leads/${lead.id}`,
  });

  const emailResult = recipientEmail
    ? await sendEmail({ to: recipientEmail, subject: tpl.subject, html: tpl.html }).catch(() => null)
    : null;

  let smsResult: { simulated: boolean } | null = null;
  if (args.alsoSms !== false && lead.customer.forwardingPhone) {
    smsResult = await sendSms({
      to: lead.customer.forwardingPhone,
      body: `New TLM lead: ${[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "n/a"} for ${lead.serviceRequested ?? "an estimate"}. Open ${env.APP_URL}/contractor/leads/${lead.id}`,
    }).catch(() => null);
  }

  await db.notification.create({
    data: {
      customerId: lead.customerId,
      category: "LEAD",
      title: `New lead: ${lead.serviceRequested ?? "estimate"}`,
      message: `From ${[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "(unknown)"} in ${lead.city ?? "—"}.`,
      link: `/contractor/leads/${lead.id}`,
    },
  }).catch(() => undefined);

  return {
    emailSent: Boolean(emailResult),
    smsSent: Boolean(smsResult),
    simulatedEmail: emailResult?.simulated ?? false,
    simulatedSms: smsResult?.simulated ?? false,
  };
}

export { isEmailConfigured };
