import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { writeAudit } from "./audit";
import type { AuthCtx } from "@/lib/auth-guard";
import { ForbiddenError, scopeToCustomer, withTenantWhere } from "@/lib/auth-guard";
import type {
  AppointmentCreateInput,
  AppointmentDecisionInput,
} from "@/schemas/appointment";

export async function listAppointments(ctx: AuthCtx) {
  const tenant = withTenantWhere(ctx);
  return db.appointment.findMany({
    where: tenant,
    orderBy: { createdAt: "desc" },
    include: {
      lead: { select: { id: true, firstName: true, lastName: true, phone: true, serviceRequested: true } },
      customer: { select: { id: true, businessName: true } },
    },
  });
}

export async function getAppointment(ctx: AuthCtx, id: string) {
  const appt = await db.appointment.findUnique({
    where: { id },
    include: {
      lead: true,
      customer: { select: { id: true, businessName: true, disputeWindowHours: true } },
      disputes: { orderBy: { submittedAt: "desc" } },
    },
  });
  if (!appt) return null;
  scopeToCustomer(ctx, appt.customerId);
  return appt;
}

export async function createAppointment(ctx: AuthCtx, input: AppointmentCreateInput) {
  return db.$transaction(async (tx) => {
    const lead = await tx.lead.findUnique({ where: { id: input.leadId } });
    if (!lead) throw new Error("Lead not found");
    scopeToCustomer(ctx, lead.customerId);
    const existing = await tx.appointment.findUnique({ where: { leadId: input.leadId } });
    if (existing) throw new Error("Appointment already exists for this lead");

    const appt = await tx.appointment.create({
      data: {
        leadId: input.leadId,
        customerId: lead.customerId,
        appointmentWindowStart: input.appointmentWindowStart,
        appointmentWindowEnd: input.appointmentWindowEnd,
        notes: input.notes,
        status: "REQUESTED",
      },
    });
    await tx.leadEvent.create({
      data: {
        leadId: lead.id,
        type: "APPOINTMENT_REQUESTED",
        description: "Appointment requested",
        createdByUserId: ctx.userId,
      },
    });
    if (lead.status === "NEW" || lead.status === "CONTACTED" || lead.status === "QUALIFIED") {
      await tx.lead.update({
        where: { id: lead.id },
        data: { status: "APPOINTMENT_REQUESTED" },
      });
    }
    await writeAudit(
      {
        userId: ctx.userId,
        customerId: lead.customerId,
        action: "APPOINTMENT_CREATED",
        entityType: "Appointment",
        entityId: appt.id,
      },
      tx,
    );
    return appt;
  });
}

export async function decideAppointment(ctx: AuthCtx, input: AppointmentDecisionInput) {
  return db.$transaction(async (tx) => {
    const appt = await tx.appointment.findUnique({
      where: { id: input.appointmentId },
      include: { customer: { select: { disputeWindowHours: true } } },
    });
    if (!appt) throw new Error("Appointment not found");
    scopeToCustomer(ctx, appt.customerId);

    const now = new Date();
    if (input.decision === "ACCEPT") {
      const disputeWindowEndsAt = new Date(
        now.getTime() + appt.customer.disputeWindowHours * 3600 * 1000,
      );
      const updated = await tx.appointment.update({
        where: { id: appt.id },
        data: {
          status: "ACCEPTED",
          acceptedByContractorAt: now,
          sentToContractorAt: appt.sentToContractorAt ?? now,
          isBillable: true,
          disputeWindowEndsAt,
        },
      });
      await tx.lead.update({
        where: { id: appt.leadId },
        data: { status: "ACCEPTED_BY_CONTRACTOR", billableStatus: "BILLABLE" },
      });
      await tx.leadEvent.create({
        data: {
          leadId: appt.leadId,
          type: "CONTRACTOR_ACCEPTED",
          description: input.note ? `Accepted — ${input.note}` : "Contractor accepted",
          createdByUserId: ctx.userId,
        },
      });
      await writeAudit(
        {
          userId: ctx.userId,
          customerId: appt.customerId,
          action: "APPOINTMENT_ACCEPTED",
          entityType: "Appointment",
          entityId: appt.id,
        },
        tx,
      );
      return updated;
    }

    const updated = await tx.appointment.update({
      where: { id: appt.id },
      data: { status: "DECLINED", isBillable: false },
    });
    await tx.lead.update({
      where: { id: appt.leadId },
      data: { status: "DECLINED_BY_CONTRACTOR" },
    });
    await tx.leadEvent.create({
      data: {
        leadId: appt.leadId,
        type: "CONTRACTOR_DECLINED",
        description: input.note ? `Declined — ${input.note}` : "Contractor declined",
        createdByUserId: ctx.userId,
      },
    });
    await writeAudit(
      {
        userId: ctx.userId,
        customerId: appt.customerId,
        action: "APPOINTMENT_DECLINED",
        entityType: "Appointment",
        entityId: appt.id,
      },
      tx,
    );
    return updated;
  });
}

export async function adminConfirmAppointment(ctx: AuthCtx, id: string) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  const appt = await db.appointment.update({
    where: { id },
    data: { status: "CONFIRMED", confirmedAt: new Date() },
  });
  await db.lead.update({
    where: { id: appt.leadId },
    data: { status: "APPOINTMENT_CONFIRMED" },
  });
  return appt;
}

export async function adminMarkSentToContractor(ctx: AuthCtx, id: string) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  return db.appointment.update({
    where: { id },
    data: { status: "SENT_TO_CONTRACTOR", sentToContractorAt: new Date() },
  });
}

export type AppointmentWithLead = Prisma.AppointmentGetPayload<{
  include: { lead: true; customer: { select: { businessName: true; disputeWindowHours: true } } };
}>;
