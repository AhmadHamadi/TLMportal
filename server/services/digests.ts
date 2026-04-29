import "server-only";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { EmailTemplates } from "@/lib/email-templates";
import { env } from "@/lib/env";
import { startOfMonth, billingMonthKey } from "@/lib/dates";

/**
 * Sends the weekly Monday digest to every active contractor (linked
 * customer user). Uses the monthlyDigest template.
 */
export async function sendWeeklyDigests(): Promise<{
  sent: number;
  skipped: number;
  errors: number;
}> {
  const month = billingMonthKey();
  const monthStart = startOfMonth();

  const customers = await db.customer.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    include: {
      users: { include: { user: { select: { email: true, name: true } } } },
    },
  });

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const customer of customers) {
    const recipients = customer.users
      .map((cu) => cu.user.email)
      .filter((e): e is string => Boolean(e));
    if (recipients.length === 0) {
      skipped += 1;
      continue;
    }
    const [leads, confirmed, billable, pendingFees] = await Promise.all([
      db.lead.count({
        where: {
          customerId: customer.id,
          createdAt: { gte: monthStart },
          deletedAt: null,
        },
      }),
      db.appointment.count({
        where: {
          customerId: customer.id,
          createdAt: { gte: monthStart },
          status: { in: ["CONFIRMED", "ACCEPTED"] },
        },
      }),
      db.appointment.count({
        where: {
          customerId: customer.id,
          createdAt: { gte: monthStart },
          isBillable: true,
        },
      }),
      db.billingRecord.aggregate({
        where: {
          customerId: customer.id,
          billingMonth: month,
          status: { in: ["PENDING", "APPROVED"] },
        },
        _sum: { amount: true },
      }),
    ]);

    const tpl = EmailTemplates.monthlyDigest({
      contractorName: customer.contactName.split(" ")[0] ?? customer.businessName,
      monthLabel: new Intl.DateTimeFormat("en-CA", {
        month: "long",
        year: "numeric",
      }).format(new Date()),
      leads,
      confirmed,
      billable,
      estimatedCharges: `$${pendingFees._sum.amount?.toString() ?? "0.00"}`,
      portalUrl: `${env.APP_URL}/contractor`,
    });
    for (const to of recipients) {
      try {
        await sendEmail({ to, subject: tpl.subject, html: tpl.html });
        sent += 1;
      } catch {
        errors += 1;
      }
    }
  }
  return { sent, skipped, errors };
}

/**
 * Finds appointments that were sent to the contractor more than 24h ago
 * and have not yet been accepted, declined, or disputed. Fires the
 * CONTRACTOR_NO_REPLY_24H automation trigger so admin-defined rules can
 * react (re-send SMS, notify admin, etc.). Idempotent: dedupes via a
 * LeadEvent of type CONTRACTOR_NO_REPLY_24H_FIRED so the same lead is not
 * triggered twice.
 */
export async function checkContractorNoReply24h(): Promise<{
  fired: number;
  skipped: number;
}> {
  const cutoff = new Date(Date.now() - 24 * 3600 * 1000);

  const candidates = await db.appointment.findMany({
    where: {
      sentToContractorAt: { not: null, lt: cutoff },
      acceptedByContractorAt: null,
      status: { in: ["SENT_TO_CONTRACTOR", "REQUESTED", "CONFIRMED"] },
    },
    select: { id: true, leadId: true, customerId: true },
    take: 200,
  });

  let fired = 0;
  let skipped = 0;
  const { dispatch } = await import("./automation");

  for (const appt of candidates) {
    const already = await db.leadEvent.findFirst({
      where: { leadId: appt.leadId, type: "CONTRACTOR_NO_REPLY_24H_FIRED" },
    });
    if (already) {
      skipped += 1;
      continue;
    }
    await db.leadEvent.create({
      data: {
        leadId: appt.leadId,
        type: "CONTRACTOR_NO_REPLY_24H_FIRED",
        description: "24h no-reply trigger fired",
      },
    });
    await dispatch({
      trigger: "CONTRACTOR_NO_REPLY_24H",
      customerId: appt.customerId,
      leadId: appt.leadId,
    }).catch(() => undefined);
    fired += 1;
  }

  return { fired, skipped };
}
