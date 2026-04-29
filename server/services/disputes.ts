import "server-only";
import { db } from "@/lib/db";
import { writeAudit } from "./audit";
import type { AuthCtx } from "@/lib/auth-guard";
import { ForbiddenError, scopeToCustomer, withTenantWhere } from "@/lib/auth-guard";
import type { DisputeCreateInput, DisputeReviewInput } from "@/schemas/dispute";

export class DisputeWindowError extends Error {
  constructor(message = "Dispute window has closed") {
    super(message);
    this.name = "DisputeWindowError";
  }
}

export async function listDisputes(ctx: AuthCtx) {
  const tenant = withTenantWhere(ctx);
  return db.dispute.findMany({
    where: tenant,
    orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
    include: {
      lead: { select: { id: true, firstName: true, lastName: true, phone: true } },
      customer: { select: { id: true, businessName: true } },
      reviewedBy: { select: { name: true, email: true } },
    },
  });
}

export async function fileDispute(ctx: AuthCtx, input: DisputeCreateInput) {
  return db.$transaction(async (tx) => {
    const appt = await tx.appointment.findUnique({
      where: { id: input.appointmentId },
      include: { customer: { select: { disputeWindowHours: true } } },
    });
    if (!appt) throw new Error("Appointment not found");
    scopeToCustomer(ctx, appt.customerId);

    // Enforce 48h (or per-customer) dispute window from acceptedByContractorAt
    const acceptedAt = appt.acceptedByContractorAt ?? appt.sentToContractorAt;
    if (!acceptedAt) {
      throw new DisputeWindowError("Cannot dispute before contractor receives the lead");
    }
    const windowEnds = new Date(
      acceptedAt.getTime() + appt.customer.disputeWindowHours * 3600 * 1000,
    );
    if (Date.now() > windowEnds.getTime() && ctx.role !== "ADMIN") {
      throw new DisputeWindowError(
        `Dispute window closed at ${windowEnds.toISOString()}`,
      );
    }

    const dispute = await tx.dispute.create({
      data: {
        leadId: appt.leadId,
        appointmentId: appt.id,
        customerId: appt.customerId,
        reason: input.reason,
        details: input.details,
        status: "OPEN",
        auditTrail: [
          {
            at: new Date().toISOString(),
            byUserId: ctx.userId,
            action: "OPENED",
            note: input.details ?? null,
          },
        ],
      },
    });
    await tx.lead.update({
      where: { id: appt.leadId },
      data: { status: "DISPUTED", billableStatus: "DISPUTED" },
    });
    await tx.leadEvent.create({
      data: {
        leadId: appt.leadId,
        type: "DISPUTE_OPENED",
        description: input.reason,
        createdByUserId: ctx.userId,
      },
    });
    await writeAudit(
      {
        userId: ctx.userId,
        customerId: appt.customerId,
        action: "DISPUTE_OPENED",
        entityType: "Dispute",
        entityId: dispute.id,
        metadata: { reason: input.reason },
      },
      tx,
    );
    return dispute;
  });
}

export async function reviewDispute(ctx: AuthCtx, input: DisputeReviewInput) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  return db.$transaction(async (tx) => {
    const before = await tx.dispute.findUnique({ where: { id: input.disputeId } });
    if (!before) throw new Error("Dispute not found");

    const dispute = await tx.dispute.update({
      where: { id: input.disputeId },
      data: {
        status: input.decision,
        reviewedAt: new Date(),
        reviewedByUserId: ctx.userId,
        decisionNote: input.decisionNote,
      },
    });
    if (input.decision === "APPROVED") {
      await tx.lead.update({
        where: { id: dispute.leadId },
        data: { status: "NOT_BILLABLE", billableStatus: "NOT_BILLABLE" },
      });
      if (dispute.appointmentId) {
        await tx.appointment.update({
          where: { id: dispute.appointmentId },
          data: { isBillable: false },
        });
      }
    } else {
      // Rejected — lead remains billable
      await tx.lead.update({
        where: { id: dispute.leadId },
        data: { billableStatus: "BILLABLE" },
      });
    }
    await tx.leadEvent.create({
      data: {
        leadId: dispute.leadId,
        type: "DISPUTE_DECIDED",
        description: `${input.decision}${input.decisionNote ? ` — ${input.decisionNote}` : ""}`,
        createdByUserId: ctx.userId,
      },
    });
    await writeAudit(
      {
        userId: ctx.userId,
        customerId: dispute.customerId,
        action: `DISPUTE_${input.decision}`,
        entityType: "Dispute",
        entityId: dispute.id,
        before: { status: before.status },
        after: { status: dispute.status, decisionNote: input.decisionNote ?? null },
      },
      tx,
    );
    return dispute;
  });
}
