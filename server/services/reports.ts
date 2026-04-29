import "server-only";
import { db } from "@/lib/db";
import { ForbiddenError, scopeToCustomer, type AuthCtx } from "@/lib/auth-guard";

function monthBounds(month: string): { start: Date; end: Date } {
  const [y, m] = month.split("-").map((s) => parseInt(s, 10));
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  return { start, end };
}

export async function buildMonthlyReport(
  ctx: AuthCtx,
  args: { customerId: string; month: string },
) {
  scopeToCustomer(ctx, args.customerId);
  const { start, end } = monthBounds(args.month);

  const customer = await db.customer.findUnique({
    where: { id: args.customerId },
    include: {
      services: { where: { isActive: true } },
      serviceAreas: { where: { isActive: true } },
    },
  });
  if (!customer) throw new Error("Customer not found");

  const where = { customerId: args.customerId, createdAt: { gte: start, lt: end } };

  const [
    leads,
    leadsBySource,
    leadsByStatus,
    appointments,
    confirmedAppts,
    billableAppts,
    callsCount,
    smsInbound,
    smsOutbound,
    spend,
    billing,
  ] = await Promise.all([
    db.lead.count({ where: { ...where, deletedAt: null } }),
    db.lead.groupBy({
      by: ["source"],
      where: { ...where, deletedAt: null },
      _count: true,
    }),
    db.lead.groupBy({
      by: ["status"],
      where: { ...where, deletedAt: null },
      _count: true,
    }),
    db.appointment.count({ where }),
    db.appointment.count({ where: { ...where, status: { in: ["CONFIRMED", "ACCEPTED"] } } }),
    db.appointment.count({ where: { ...where, isBillable: true } }),
    db.callLog.count({ where }),
    db.smsMessage.count({ where: { ...where, direction: "INBOUND" } }),
    db.smsMessage.count({ where: { ...where, direction: "OUTBOUND" } }),
    db.googleAdsSpend.findUnique({
      where: { customerId_month: { customerId: args.customerId, month: args.month } },
    }),
    db.billingRecord.findMany({
      where: { customerId: args.customerId, billingMonth: args.month },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const recentLeads = await db.lead.findMany({
    where: { ...where, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      city: true,
      serviceRequested: true,
      source: true,
      status: true,
      billableStatus: true,
      createdAt: true,
    },
  });

  const adSpendNum = Number(spend?.spendAmount?.toString() ?? "0");
  const cpl = leads > 0 ? adSpendNum / leads : 0;
  const cpa = confirmedAppts > 0 ? adSpendNum / confirmedAppts : 0;

  return {
    customer,
    month: args.month,
    range: { start, end },
    totals: {
      leads,
      appointments,
      confirmedAppts,
      billableAppts,
      callsCount,
      smsInbound,
      smsOutbound,
      adSpend: adSpendNum,
      adSpendImpressions: spend?.impressions ?? null,
      adSpendClicks: spend?.clicks ?? null,
      adSpendConversions: spend?.conversions ?? null,
      cpl,
      cpa,
    },
    leadsBySource: leadsBySource.map((g) => ({ source: g.source, count: g._count })),
    leadsByStatus: leadsByStatus.map((g) => ({ status: g.status, count: g._count })),
    recentLeads,
    billing: billing.map((b) => ({
      id: b.id,
      type: b.type,
      amount: b.amount.toString(),
      status: b.status,
      description: b.description,
    })),
  };
}

export type MonthlyReport = Awaited<ReturnType<typeof buildMonthlyReport>>;

export async function listAvailableReportMonths(
  ctx: AuthCtx,
  customerId: string,
): Promise<string[]> {
  scopeToCustomer(ctx, customerId);
  const oldest = await db.lead.findFirst({
    where: { customerId },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });
  if (!oldest) return [];
  const months: string[] = [];
  const cur = new Date(
    Date.UTC(
      oldest.createdAt.getUTCFullYear(),
      oldest.createdAt.getUTCMonth(),
      1,
    ),
  );
  const nowM = new Date();
  const stop = new Date(Date.UTC(nowM.getUTCFullYear(), nowM.getUTCMonth(), 1));
  while (cur.getTime() <= stop.getTime()) {
    months.push(
      `${cur.getUTCFullYear()}-${String(cur.getUTCMonth() + 1).padStart(2, "0")}`,
    );
    cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  if (ctx.role !== "ADMIN") {
    if (!ctx.customerIds.includes(customerId)) {
      throw new ForbiddenError();
    }
  }
  return months.reverse();
}
