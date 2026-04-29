import "server-only";
import { Prisma, type LeadStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { writeAudit } from "./audit";
import { dispatch as dispatchAutomation } from "./automation";
import type { AuthCtx } from "@/lib/auth-guard";
import { ForbiddenError, scopeToCustomer, withTenantWhere } from "@/lib/auth-guard";
import type {
  LeadBillableUpdateInput,
  LeadCreateInput,
  LeadFilterInput,
  LeadStatusUpdateInput,
} from "@/schemas/lead";

const PAGE_SIZE = 25;

export async function listLeads(ctx: AuthCtx, filter: LeadFilterInput = { page: 1 }) {
  const tenant = withTenantWhere(ctx);
  const where: Prisma.LeadWhereInput = {
    deletedAt: null,
    ...tenant,
    ...(filter.customerId ? { customerId: filter.customerId } : {}),
    ...(filter.source ? { source: filter.source } : {}),
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.billableStatus ? { billableStatus: filter.billableStatus } : {}),
    ...(filter.q
      ? {
          OR: [
            { firstName: { contains: filter.q, mode: "insensitive" } },
            { lastName: { contains: filter.q, mode: "insensitive" } },
            { phone: { contains: filter.q } },
            { email: { contains: filter.q, mode: "insensitive" } },
            { city: { contains: filter.q, mode: "insensitive" } },
            { serviceRequested: { contains: filter.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const page = filter.page ?? 1;
  const [items, total] = await Promise.all([
    db.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        customer: { select: { id: true, businessName: true, slug: true } },
        appointment: { select: { id: true, status: true, isBillable: true } },
      },
    }),
    db.lead.count({ where }),
  ]);
  return { items, total, page, pageSize: PAGE_SIZE };
}

export async function getLead(ctx: AuthCtx, id: string) {
  const lead = await db.lead.findFirst({
    where: { id, deletedAt: null },
    include: {
      customer: { select: { id: true, businessName: true, slug: true, disputeWindowHours: true } },
      appointment: true,
      events: { orderBy: { createdAt: "desc" }, include: { createdByUser: { select: { name: true, email: true } } } },
      callLogs: { orderBy: { createdAt: "desc" } },
      smsMessages: { orderBy: { createdAt: "desc" } },
      disputes: { orderBy: { submittedAt: "desc" } },
    },
  });
  if (!lead) return null;
  scopeToCustomer(ctx, lead.customerId);
  return lead;
}

function dedupeHash(customerId: string, phone: string | null, monthsBucket: number): string {
  return `${customerId}:${phone ?? ""}:${monthsBucket}`;
}

export async function createLead(ctx: AuthCtx, input: LeadCreateInput) {
  scopeToCustomer(ctx, input.customerId);
  const monthsBucket = Math.floor(Date.now() / (30 * 24 * 3600 * 1000));
  const hash = dedupeHash(input.customerId, input.phone ?? null, monthsBucket);

  return db.$transaction(async (tx) => {
    const lead = await tx.lead.create({
      data: {
        customerId: input.customerId,
        source: input.source,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email,
        city: input.city,
        neighbourhood: input.neighbourhood,
        address: input.address,
        serviceRequested: input.serviceRequested,
        projectDetails: input.projectDetails,
        preferredTime: input.preferredTime,
        estimatedProjectSize: input.estimatedProjectSize,
        dedupeHash: hash,
      },
    });
    await tx.leadEvent.create({
      data: {
        leadId: lead.id,
        type: "LEAD_CREATED",
        description: `Lead created from ${input.source}`,
        createdByUserId: ctx.userId,
      },
    });
    await writeAudit(
      {
        userId: ctx.userId,
        customerId: input.customerId,
        action: "LEAD_CREATED",
        entityType: "Lead",
        entityId: lead.id,
        metadata: { source: input.source },
      },
      tx,
    );
    return lead;
  }).then(async (lead) => {
    // Fire automation rules + email/SMS notification outside the lead-creation transaction.
    const { notifyContractorOfNewLead } = await import("./notifications");
    await Promise.allSettled([
      dispatchAutomation({
        trigger: "LEAD_CREATED",
        customerId: lead.customerId,
        leadId: lead.id,
      }),
      notifyContractorOfNewLead({ leadId: lead.id, alsoSms: false }),
    ]);
    return lead;
  });
}

const TERMINAL: LeadStatus[] = ["WON", "LOST", "NOT_BILLABLE", "CANCELLED", "DUPLICATE", "SPAM"];

export async function updateLeadStatus(ctx: AuthCtx, input: LeadStatusUpdateInput) {
  return db.$transaction(async (tx) => {
    const before = await tx.lead.findUnique({ where: { id: input.leadId } });
    if (!before || before.deletedAt) throw new Error("Lead not found");
    scopeToCustomer(ctx, before.customerId);
    if (TERMINAL.includes(before.status) && ctx.role !== "ADMIN") {
      throw new ForbiddenError("Lead is in a terminal state");
    }
    const lead = await tx.lead.update({
      where: { id: input.leadId },
      data: { status: input.status },
    });
    await tx.leadEvent.create({
      data: {
        leadId: lead.id,
        type: "STATUS_CHANGED",
        description: `${before.status} → ${input.status}${input.note ? ` — ${input.note}` : ""}`,
        createdByUserId: ctx.userId,
        metadata: { from: before.status, to: input.status, note: input.note ?? null },
      },
    });
    await writeAudit(
      {
        userId: ctx.userId,
        customerId: before.customerId,
        action: "LEAD_STATUS_CHANGED",
        entityType: "Lead",
        entityId: lead.id,
        before: { status: before.status },
        after: { status: lead.status },
      },
      tx,
    );
    return lead;
  });
}

export async function setLeadBillable(ctx: AuthCtx, input: LeadBillableUpdateInput) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  return db.$transaction(async (tx) => {
    const before = await tx.lead.findUnique({ where: { id: input.leadId } });
    if (!before) throw new Error("Lead not found");
    const lead = await tx.lead.update({
      where: { id: input.leadId },
      data: {
        billableStatus: input.billableStatus,
        notBillableReason: input.notBillableReason ?? null,
      },
    });
    await tx.leadEvent.create({
      data: {
        leadId: lead.id,
        type: "BILLABLE_CHANGED",
        description: `${before.billableStatus} → ${input.billableStatus}`,
        createdByUserId: ctx.userId,
        metadata: { reason: input.notBillableReason ?? null },
      },
    });
    await writeAudit(
      {
        userId: ctx.userId,
        customerId: before.customerId,
        action: "LEAD_BILLABLE_CHANGED",
        entityType: "Lead",
        entityId: lead.id,
        before: { billableStatus: before.billableStatus },
        after: { billableStatus: lead.billableStatus, reason: input.notBillableReason ?? null },
      },
      tx,
    );
    return lead;
  });
}
