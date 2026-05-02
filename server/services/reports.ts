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
    formSubmissions,
    organicLeads,
    callLeadsCount,
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
    // Website: form submissions = leads coming from a landing-page form or quote button
    db.lead.count({
      where: {
        ...where,
        deletedAt: null,
        source: { in: ["LANDING_PAGE_FORM", "QUOTE_BUTTON"] },
      },
    }),
    // SEO proxy: leads NOT from Google Ads or Manual = "organic-ish". Real GSC numbers come from API later.
    db.lead.count({
      where: {
        ...where,
        deletedAt: null,
        source: {
          in: ["LANDING_PAGE_FORM", "QUOTE_BUTTON", "TRACKING_PHONE_CALL", "SMS_REPLY"],
        },
      },
    }),
    // GBP proxy: phone calls to tracking number (most likely from GBP listing)
    db.lead.count({
      where: { ...where, deletedAt: null, source: "TRACKING_PHONE_CALL" },
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
  const adsConversions = spend?.conversions ?? 0;
  const adsCostPerConversion = adsConversions > 0 ? adSpendNum / adsConversions : 0;

  // Service-tailored sections — only included when the customer has the package enabled.
  const sections = {
    leadEngine: customer.leadEngineEnabled
      ? {
          totalLeads: leads,
          calls: callsCount,
          smsInbound,
          smsOutbound,
          confirmedAppts,
          billableAppts,
          bookingRate: leads > 0 ? Math.round((confirmedAppts / leads) * 100) : 0,
        }
      : null,
    googleAds: customer.googleAdsEnabled
      ? {
          spend: adSpendNum,
          impressions: spend?.impressions ?? null,
          clicks: spend?.clicks ?? null,
          ctr:
            spend?.impressions && spend.clicks != null && spend.impressions > 0
              ? (spend.clicks / spend.impressions) * 100
              : null,
          conversions: spend?.conversions ?? null,
          costPerConversion: adsCostPerConversion,
          cpl,
          cpa,
          notes: spend?.notes ?? null,
          // Real Google Ads API integration ships in a later phase; until then,
          // these come from manual /admin/ad-spend entries.
          dataSource: "manual" as const,
        }
      : null,
    website: customer.websiteEnabled
      ? {
          formSubmissions,
          // formViews / pageViews require GA4 integration; show null until wired.
          pageViews: null as number | null,
          conversionRate: null as number | null,
          websiteUrl: customer.websiteUrl,
          landingPageUrl: customer.landingPageUrl,
        }
      : null,
    localSeo: customer.localSeoEnabled
      ? {
          organicLeads,
          // GSC impressions/clicks/avg position come from API integration later.
          gscImpressions: null as number | null,
          gscClicks: null as number | null,
          gscAvgPosition: null as number | null,
          dataSource: "manual" as const,
        }
      : null,
    gbp: customer.gbpEnabled
      ? {
          trackingCalls: callLeadsCount,
          // Direction requests, profile views come from Business Profile Performance API later.
          profileViews: null as number | null,
          directionRequests: null as number | null,
          dataSource: "manual" as const,
        }
      : null,
  };

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
    sections,
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
