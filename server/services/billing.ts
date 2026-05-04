import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { writeAudit } from "./audit";
import type { AuthCtx } from "@/lib/auth-guard";
import { ForbiddenError, scopeToCustomer, withTenantWhere } from "@/lib/auth-guard";
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

/**
 * Agency-level revenue snapshot for /admin/billing — what's the agency
 * actually making this month, and how does that compare to the leads we're
 * generating? This is profit-side data, not customer-side.
 */
export async function agencyRevenueStats(ctx: AuthCtx) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  const monthStart = startOfMonth();
  const month = billingMonthKey();

  const [
    activeCustomers,
    contractedMRRAgg,
    paidRetainerThisMonth,
    paidAppointmentFeesThisMonth,
    pendingThisMonth,
    leadsThisMonth,
    leadsLastMonth,
    confirmedThisMonth,
    billableThisMonth,
  ] = await Promise.all([
    db.customer.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    // Contracted MRR = sum of monthly retainer + SEO/GBP retainer across all
    // ACTIVE customers, regardless of whether Stripe has actually invoiced.
    // This is what we EXPECT to bill every month.
    db.customer.aggregate({
      where: { deletedAt: null, status: "ACTIVE" },
      _sum: { monthlyRetainer: true, seoGbpMonthlyRetainer: true },
    }),
    // Actual paid this month — what's already in Stripe / cash.
    db.billingRecord.aggregate({
      where: { billingMonth: month, type: "MONTHLY_RETAINER", status: "PAID" },
      _sum: { amount: true },
    }),
    db.billingRecord.aggregate({
      where: { billingMonth: month, type: "APPOINTMENT_FEE", status: { in: ["PAID", "INVOICED"] } },
      _sum: { amount: true },
    }),
    db.billingRecord.aggregate({
      where: { billingMonth: month, status: { in: ["PENDING", "APPROVED"] } },
      _sum: { amount: true },
    }),
    db.lead.count({ where: { createdAt: { gte: monthStart }, deletedAt: null } }),
    db.lead.count({
      where: {
        createdAt: {
          gte: new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() - 1, 1)),
          lt: monthStart,
        },
        deletedAt: null,
      },
    }),
    db.appointment.count({
      where: { createdAt: { gte: monthStart }, status: { in: ["CONFIRMED", "ACCEPTED"] } },
    }),
    db.appointment.count({
      where: { createdAt: { gte: monthStart }, isBillable: true },
    }),
  ]);

  const contractedMRR =
    Number(contractedMRRAgg._sum.monthlyRetainer?.toString() ?? "0") +
    Number(contractedMRRAgg._sum.seoGbpMonthlyRetainer?.toString() ?? "0");
  const paidRetainer = Number(paidRetainerThisMonth._sum.amount?.toString() ?? "0");
  const paidAppointmentFees = Number(paidAppointmentFeesThisMonth._sum.amount?.toString() ?? "0");
  const totalRevenue = paidRetainer + paidAppointmentFees;
  const pending = Number(pendingThisMonth._sum.amount?.toString() ?? "0");
  const leadsDelta =
    leadsLastMonth > 0
      ? ((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100
      : leadsThisMonth > 0
        ? 100
        : 0;
  const revenuePerLead = leadsThisMonth > 0 ? totalRevenue / leadsThisMonth : 0;

  return {
    month,
    activeCustomers,
    contractedMRR: contractedMRR.toFixed(2),
    paidRetainer: paidRetainer.toFixed(2),
    paidAppointmentFees: paidAppointmentFees.toFixed(2),
    totalRevenue: totalRevenue.toFixed(2),
    pending: pending.toFixed(2),
    leadsThisMonth,
    leadsLastMonth,
    leadsDeltaPct: leadsDelta.toFixed(0),
    confirmedThisMonth,
    billableThisMonth,
    revenuePerLead: revenuePerLead.toFixed(2),
  };
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
  if (customerId) {
    scopeToCustomer(ctx, customerId);
  }
  const tenant = withTenantWhere(ctx);
  const month = billingMonthKey();
  const where: Prisma.BillingRecordWhereInput = {
    ...(customerId ? { customerId } : {}),
    ...tenant,
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
      include: { customer: { select: { appointmentFee: true, billingCurrency: true } } },
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
        currency: appt.customer.billingCurrency,
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
export async function contractorDashboardData(ctx: AuthCtx) {
  if (ctx.role !== "CONTRACTOR") throw new ForbiddenError();
  const where = { customerId: { in: ctx.customerIds } };
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const next14Days = new Date(todayStart);
  next14Days.setDate(next14Days.getDate() + 14);

  const [
    customers,
    actionAppointments,
    upcomingAppointments,
    recentLeads,
    recentCallLogs,
    notifications,
  ] = await Promise.all([
    db.customer.findMany({
      where: { id: { in: ctx.customerIds }, deletedAt: null },
      select: {
        id: true,
        businessName: true,
        monthlyAdBudget: true,
        googleAdsBudgetCurrency: true,
        leadEngineEnabled: true,
        googleAdsEnabled: true,
        websiteEnabled: true,
        localSeoEnabled: true,
        gbpEnabled: true,
        seoGbpMonthlyRetainer: true,
      },
    }),
    db.appointment.findMany({
      where: {
        ...where,
        status: { in: ["REQUESTED", "CONFIRMED", "SENT_TO_CONTRACTOR"] },
      },
      orderBy: [{ appointmentWindowStart: "asc" }, { createdAt: "desc" }],
      take: 6,
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            city: true,
            serviceRequested: true,
            source: true,
            status: true,
          },
        },
      },
    }),
    db.appointment.findMany({
      where: {
        ...where,
        appointmentWindowStart: { gte: todayStart, lt: next14Days },
        status: { in: ["ACCEPTED", "CONFIRMED", "SENT_TO_CONTRACTOR", "REQUESTED"] },
      },
      orderBy: { appointmentWindowStart: "asc" },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            city: true,
            serviceRequested: true,
            source: true,
            status: true,
          },
        },
      },
    }),
    db.lead.findMany({
      where: { ...where, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        city: true,
        serviceRequested: true,
        status: true,
        createdAt: true,
        appointment: { select: { status: true, appointmentWindowStart: true } },
      },
    }),
    db.callLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            serviceRequested: true,
            appointment: { select: { id: true, status: true } },
          },
        },
      },
    }),
    db.notification.findMany({
      where: {
        OR: [{ customerId: { in: ctx.customerIds } }, { userId: ctx.userId }],
        status: "UNREAD",
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, message: true, category: true, link: true, createdAt: true },
    }),
  ]);

  return { customers, actionAppointments, upcomingAppointments, recentLeads, recentCallLogs, notifications };
}

export async function contractorCallLogData(ctx: AuthCtx) {
  if (ctx.role !== "CONTRACTOR") throw new ForbiddenError();
  return db.callLog.findMany({
    where: { customerId: { in: ctx.customerIds } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          serviceRequested: true,
          appointment: { select: { id: true, status: true } },
        },
      },
    },
  });
}

export async function contractorSmsSummaryData(ctx: AuthCtx) {
  if (ctx.role !== "CONTRACTOR") throw new ForbiddenError();
  const leads = await db.lead.findMany({
    where: {
      customerId: { in: ctx.customerIds },
      deletedAt: null,
      smsMessages: { some: {} },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      serviceRequested: true,
      city: true,
      preferredTime: true,
      status: true,
      appointment: { select: { id: true, status: true, appointmentWindowStart: true } },
      smsMessages: {
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, direction: true, body: true, createdAt: true },
      },
    },
  });
  return leads;
}
