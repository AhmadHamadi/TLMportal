import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { writeAudit } from "./audit";
import type { AuthCtx } from "@/lib/auth-guard";
import { ForbiddenError, withTenantWhere } from "@/lib/auth-guard";
import { billingMonthKey, startOfMonth } from "@/lib/dates";

export type BillableEvaluation =
  | { isBillable: true }
  | { isBillable: false; reason: string };

export type BillableInputs = {
  lead: {
    status: string;
    billableStatus: string;
    phone: string | null;
    city: string | null;
    serviceRequested: string | null;
    estimatedProjectSize: Prisma.Decimal | null;
  };
  appointment: {
    appointmentWindowStart: Date | null;
    sentToContractorAt: Date | null;
    acceptedByContractorAt: Date | null;
    cancelledAt: Date | null;
    disputeWindowEndsAt: Date | null;
  };
  customer: {
    minProjectSize: Prisma.Decimal | null;
    services: { name: string; isActive: boolean }[];
    serviceAreas: { city: string; isActive: boolean }[];
  };
  hasOpenValidDispute: boolean;
};

export function evaluateBillable(input: BillableInputs): BillableEvaluation {
  const { lead, appointment, customer, hasOpenValidDispute } = input;

  if (lead.status === "SPAM" || lead.billableStatus === "NOT_BILLABLE") {
    return { isBillable: false, reason: "SPAM_OR_FLAGGED" };
  }
  if (!lead.phone || !/^\+[1-9]\d{6,14}$/.test(lead.phone)) {
    return { isBillable: false, reason: "WRONG_NUMBER" };
  }
  if (lead.serviceRequested) {
    const matches = customer.services.some(
      (s) =>
        s.isActive &&
        (s.name.toLowerCase().includes(lead.serviceRequested!.toLowerCase()) ||
          lead.serviceRequested!.toLowerCase().includes(s.name.toLowerCase())),
    );
    if (!matches && customer.services.length > 0) {
      return { isBillable: false, reason: "SERVICE_NOT_OFFERED" };
    }
  }
  if (lead.city) {
    const inArea = customer.serviceAreas.some(
      (a) => a.isActive && a.city.toLowerCase() === lead.city!.toLowerCase(),
    );
    if (!inArea && customer.serviceAreas.length > 0) {
      return { isBillable: false, reason: "OUTSIDE_SERVICE_AREA" };
    }
  }
  if (
    customer.minProjectSize &&
    lead.estimatedProjectSize &&
    lead.estimatedProjectSize.lt(customer.minProjectSize)
  ) {
    return { isBillable: false, reason: "BELOW_MIN_JOB_SIZE" };
  }
  if (!appointment.appointmentWindowStart && !appointment.sentToContractorAt) {
    return { isBillable: false, reason: "NO_TIME_AGREED" };
  }
  if (!appointment.sentToContractorAt) {
    return { isBillable: false, reason: "CONTRACTOR_NOT_NOTIFIED" };
  }
  if (appointment.cancelledAt) {
    return { isBillable: false, reason: "CANCELLED_BEFORE_CONFIRMATION" };
  }
  if (hasOpenValidDispute) {
    return { isBillable: false, reason: "OPEN_VALID_DISPUTE" };
  }
  return { isBillable: true };
}

export async function listBillingRecords(ctx: AuthCtx) {
  const tenant = withTenantWhere(ctx);
  return db.billingRecord.findMany({
    where: tenant,
    orderBy: [{ billingMonth: "desc" }, { createdAt: "desc" }],
    include: {
      customer: { select: { id: true, businessName: true } },
      lead: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function monthlySummary(ctx: AuthCtx, customerId?: string) {
  const tenant = withTenantWhere(ctx);
  const month = billingMonthKey();
  const where: Prisma.BillingRecordWhereInput = {
    ...tenant,
    ...(customerId ? { customerId } : {}),
    billingMonth: month,
  };
  const grouped = await db.billingRecord.groupBy({
    by: ["customerId", "type", "status"],
    where,
    _sum: { amount: true },
    _count: true,
  });
  return { month, grouped };
}

export async function approveAppointmentFee(
  ctx: AuthCtx,
  args: { appointmentId: string },
) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  return db.$transaction(async (tx) => {
    const appt = await tx.appointment.findUnique({
      where: { id: args.appointmentId },
      include: { customer: { select: { appointmentFee: true } } },
    });
    if (!appt) throw new Error("Appointment not found");
    if (!appt.isBillable) throw new Error("Appointment not billable");

    const month = billingMonthKey();
    const existing = await tx.billingRecord.findFirst({
      where: { leadId: appt.leadId, type: "APPOINTMENT_FEE" },
    });
    if (existing) return existing;

    const record = await tx.billingRecord.create({
      data: {
        customerId: appt.customerId,
        leadId: appt.leadId,
        appointmentId: appt.id,
        type: "APPOINTMENT_FEE",
        amount: appt.customer.appointmentFee,
        status: "APPROVED",
        billingMonth: month,
        description: "Confirmed estimate appointment",
      },
    });
    await writeAudit(
      {
        userId: ctx.userId,
        customerId: appt.customerId,
        action: "APPOINTMENT_FEE_APPROVED",
        entityType: "BillingRecord",
        entityId: record.id,
      },
      tx,
    );
    return record;
  });
}

export async function adminOverviewStats(ctx: AuthCtx) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  const monthStart = startOfMonth();
  const month = billingMonthKey();

  const [
    totalCustomers,
    activeCustomers,
    leadsThisMonth,
    confirmedThisMonth,
    billableThisMonth,
    openDisputes,
    callsThisMonth,
    formsThisMonth,
    monthlyRevenue,
    appointmentFeeRevenue,
  ] = await Promise.all([
    db.customer.count({ where: { deletedAt: null } }),
    db.customer.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    db.lead.count({ where: { createdAt: { gte: monthStart }, deletedAt: null } }),
    db.appointment.count({
      where: { createdAt: { gte: monthStart }, status: { in: ["CONFIRMED", "ACCEPTED"] } },
    }),
    db.appointment.count({
      where: { createdAt: { gte: monthStart }, isBillable: true },
    }),
    db.dispute.count({ where: { status: "OPEN" } }),
    db.callLog.count({ where: { createdAt: { gte: monthStart } } }),
    db.lead.count({
      where: {
        createdAt: { gte: monthStart },
        source: { in: ["LANDING_PAGE_FORM", "GOOGLE_ADS_LEAD_FORM", "QUOTE_BUTTON"] },
      },
    }),
    db.billingRecord.aggregate({
      where: { billingMonth: month, type: "MONTHLY_RETAINER" },
      _sum: { amount: true },
    }),
    db.billingRecord.aggregate({
      where: { billingMonth: month, type: "APPOINTMENT_FEE" },
      _sum: { amount: true },
    }),
  ]);

  return {
    totalCustomers,
    activeCustomers,
    leadsThisMonth,
    confirmedThisMonth,
    billableThisMonth,
    openDisputes,
    callsThisMonth,
    formsThisMonth,
    monthlyRevenue: monthlyRevenue._sum.amount?.toString() ?? "0.00",
    appointmentFeeRevenue: appointmentFeeRevenue._sum.amount?.toString() ?? "0.00",
  };
}

export async function contractorOverviewStats(ctx: AuthCtx) {
  if (ctx.role !== "CONTRACTOR") throw new ForbiddenError();
  const monthStart = startOfMonth();
  const month = billingMonthKey();
  const where = { customerId: { in: ctx.customerIds } };

  const [
    leadsThisMonth,
    callsThisMonth,
    confirmedThisMonth,
    billableThisMonth,
    pendingFees,
    paidFees,
    adSpend,
  ] = await Promise.all([
    db.lead.count({ where: { ...where, createdAt: { gte: monthStart }, deletedAt: null } }),
    db.callLog.count({ where: { ...where, createdAt: { gte: monthStart } } }),
    db.appointment.count({
      where: {
        ...where,
        createdAt: { gte: monthStart },
        status: { in: ["CONFIRMED", "ACCEPTED"] },
      },
    }),
    db.appointment.count({
      where: { ...where, createdAt: { gte: monthStart }, isBillable: true },
    }),
    db.billingRecord.aggregate({
      where: { ...where, billingMonth: month, status: { in: ["PENDING", "APPROVED"] } },
      _sum: { amount: true },
    }),
    db.billingRecord.aggregate({
      where: { ...where, billingMonth: month, status: "PAID" },
      _sum: { amount: true },
    }),
    db.googleAdsSpend.aggregate({
      where: { ...where, month },
      _sum: { spendAmount: true },
    }),
  ]);

  const totalLeads = leadsThisMonth || 0;
  const totalConfirmed = confirmedThisMonth || 0;
  const adSpendNum = Number(adSpend._sum.spendAmount?.toString() ?? "0");
  const cpl = totalLeads > 0 ? adSpendNum / totalLeads : 0;
  const cpa = totalConfirmed > 0 ? adSpendNum / totalConfirmed : 0;

  return {
    leadsThisMonth,
    callsThisMonth,
    confirmedThisMonth,
    billableThisMonth,
    estimatedCharges: pendingFees._sum.amount?.toString() ?? "0.00",
    paidThisMonth: paidFees._sum.amount?.toString() ?? "0.00",
    adSpend: adSpend._sum.spendAmount?.toString() ?? "0.00",
    costPerLead: cpl.toFixed(2),
    costPerAppointment: cpa.toFixed(2),
  };
}
