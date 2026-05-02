"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import type { MonthlyReport } from "@/server/services/reports";
import { BrandMark } from "@/components/shared/brand-mark";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const SOURCE_LABELS: Record<string, string> = {
  LANDING_PAGE_FORM: "Landing page form",
  GOOGLE_ADS_LEAD_FORM: "Google Ads form",
  TRACKING_PHONE_CALL: "Phone call",
  SMS_REPLY: "SMS reply",
  MANUAL_ADMIN_ENTRY: "Manual entry",
  QUOTE_BUTTON: "Quote button",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  APPOINTMENT_REQUESTED: "Appt requested",
  APPOINTMENT_CONFIRMED: "Appt confirmed",
  SENT_TO_CONTRACTOR: "Sent to contractor",
  ACCEPTED_BY_CONTRACTOR: "Accepted",
  DECLINED_BY_CONTRACTOR: "Declined",
  COMPLETED_ESTIMATE: "Estimate completed",
  QUOTED: "Quoted",
  WON: "Won",
  LOST: "Lost",
  DISPUTED: "Under review",
  NOT_BILLABLE: "Not billable",
  CANCELLED: "Cancelled",
  DUPLICATE: "Duplicate",
  SPAM: "Spam",
};

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map((s) => parseInt(s, 10));
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

function generatedOn(): string {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());
}

function executiveSummary(report: MonthlyReport): string {
  const { totals, customer } = report;
  const bookingRate =
    totals.leads > 0 ? Math.round((totals.confirmedAppts / totals.leads) * 100) : 0;
  const billRate =
    totals.confirmedAppts > 0
      ? Math.round((totals.billableAppts / totals.confirmedAppts) * 100)
      : 0;
  const cplCopy =
    totals.adSpend > 0 && totals.leads > 0
      ? `Cost per lead landed at ${formatMoney(totals.cpl)} on ${formatMoney(totals.adSpend)} of ad spend.`
      : "";
  const trafficCopy =
    totals.leads === 0
      ? `No leads were generated for ${customer.businessName} in this period — campaigns may have been paused or unfunded.`
      : `${customer.businessName} received ${totals.leads} new lead${totals.leads === 1 ? "" : "s"}, with ${totals.confirmedAppts} converting to a booked estimate (${bookingRate}% booking rate).`;
  const billingCopy =
    totals.billableAppts > 0
      ? ` ${totals.billableAppts} booked appointment${totals.billableAppts === 1 ? "" : "s"} (${billRate}%) qualified for billing.`
      : "";
  return `${trafficCopy}${billingCopy}${cplCopy ? ` ${cplCopy}` : ""}`;
}

export function ReportView({ report }: { report: MonthlyReport }) {
  const { customer, month, totals, leadsBySource, leadsByStatus, recentLeads, billing } = report;
  const totalLeads = totals.leads || 1;
  const maxSourceCount = Math.max(1, ...leadsBySource.map((source) => source.count));
  const billingTotal = billing.reduce((sum, row) => sum + Number(row.amount), 0);
  const bookingRate =
    totals.leads > 0 ? Math.round((totals.confirmedAppts / totals.leads) * 100) : 0;

  return (
    <div className="report-root">
      <style>{`
        :root { --report-orange: #F37021; --report-navy: #0A1B3D; --report-ink: #0F172A; --report-mute: #475569; --report-line: #E2E8F0; }
        .report-page { font-feature-settings: "ss01", "cv11", "tnum"; color: var(--report-ink); }
        .report-page h1, .report-page h2, .report-page h3 { letter-spacing: -0.01em; }

        @media print {
          .no-print { display: none !important; }
          body, html {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .report-page {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
          .report-cover { page-break-after: always; min-height: 88vh; }
          .report-section { page-break-inside: avoid; }
          .report-footer-print { display: block !important; }
          @page { size: Letter; margin: 14mm 12mm 18mm; }
        }
        .report-footer-print { display: none; }
      `}</style>

      <div className="no-print mb-4 flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Print or save as PDF (Ctrl/Cmd+P). Layout is tuned for Letter, 14&thinsp;mm margins.
        </p>
        <Button onClick={() => window.print()} variant="outline" size="sm" className="gap-2">
          <Printer className="h-4 w-4" />
          Save as PDF
        </Button>
      </div>

      <article className="report-page mx-auto max-w-3xl rounded-xl border bg-card p-10 shadow-sm space-y-8">
        {/* COVER ----------------------------------------------------- */}
        <header className="report-cover space-y-8">
          <div className="flex items-start justify-between gap-4">
            <BrandMark size={42} wordmark="Trade Leads" />
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--report-mute)] font-semibold">
                Performance report
              </div>
              <div className="mt-0.5 text-xs text-[var(--report-mute)]">
                Generated {generatedOn()}
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-[var(--report-line)] space-y-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--report-mute)] font-semibold">
              Prepared for
            </div>
            <h1 className="font-display text-4xl font-bold leading-[1.05]">
              {customer.businessName}
            </h1>
            <div className="text-lg text-[var(--report-mute)]">{monthLabel(month)}</div>
          </div>
          <div className="pt-6 grid grid-cols-3 gap-3">
            <Hero
              label="Total leads"
              value={totals.leads}
              hint={
                totals.leads > 0
                  ? `${SOURCE_LABELS[leadsBySource[0]?.source ?? ""] ?? "—"} led the mix`
                  : "Campaigns paused or unfunded"
              }
            />
            <Hero
              label="Booked appointments"
              value={totals.confirmedAppts}
              hint={`${bookingRate}% booking rate`}
              accent
            />
            <Hero
              label="Billable appointments"
              value={totals.billableAppts}
              hint={
                totals.billableAppts > 0
                  ? `${formatMoney(totals.cpa)} cost / appt`
                  : "—"
              }
            />
          </div>
          <div className="pt-6 mt-4 border-t border-[var(--report-line)] space-y-2">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--report-mute)] font-semibold">
              Executive summary
            </div>
            <p className="text-[14px] leading-[1.65] text-[var(--report-ink)]">
              {executiveSummary(report)}
            </p>
          </div>
        </header>

        {/* GOOGLE ADS — only when package is enabled ----------------- */}
        {report.sections?.googleAds ? (
          <section className="report-section space-y-4">
            <SectionHeading kicker="Google Ads" title="Paid search performance" />
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Ad spend" value={formatMoney(report.sections.googleAds.spend)} />
              <Stat
                label="Cost / lead"
                value={report.sections.googleAds.cpl > 0 ? formatMoney(report.sections.googleAds.cpl) : "—"}
              />
              <Stat
                label="Cost / booked appt"
                value={report.sections.googleAds.cpa > 0 ? formatMoney(report.sections.googleAds.cpa) : "—"}
              />
            </div>
            {report.sections.googleAds.impressions != null || report.sections.googleAds.clicks != null ? (
              <div className="grid grid-cols-3 gap-3 text-[12px] text-[var(--report-mute)] pt-1">
                <span>
                  Impressions:{" "}
                  <strong className="text-[var(--report-ink)] tabular-nums">
                    {(report.sections.googleAds.impressions ?? 0).toLocaleString()}
                  </strong>
                </span>
                <span>
                  Clicks:{" "}
                  <strong className="text-[var(--report-ink)] tabular-nums">
                    {(report.sections.googleAds.clicks ?? 0).toLocaleString()}
                  </strong>
                </span>
                <span>
                  CTR:{" "}
                  <strong className="text-[var(--report-ink)] tabular-nums">
                    {report.sections.googleAds.ctr != null
                      ? report.sections.googleAds.ctr.toFixed(2) + "%"
                      : "—"}
                  </strong>
                </span>
              </div>
            ) : null}
            {report.sections.googleAds.dataSource === "manual" ? (
              <p className="text-[10px] text-[var(--report-mute)] italic">
                Spend numbers entered manually. Live Google Ads API data lands once the dev token is approved.
              </p>
            ) : null}
          </section>
        ) : null}

        {/* WEBSITE — form submissions when website package is enabled */}
        {report.sections?.website ? (
          <section className="report-section space-y-4">
            <SectionHeading kicker="Website" title="Form submissions &amp; traffic" />
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Form submissions" value={report.sections.website.formSubmissions} />
              <Stat label="Page views" value={report.sections.website.pageViews ?? "—"} />
              <Stat
                label="Conversion rate"
                value={
                  report.sections.website.conversionRate != null
                    ? `${report.sections.website.conversionRate.toFixed(1)}%`
                    : "—"
                }
              />
            </div>
            {report.sections.website.pageViews == null ? (
              <p className="text-[10px] text-[var(--report-mute)] italic">
                Form submissions are tracked from the public lead-intake endpoint. Page views populate
                once Google Analytics is wired into the website.
              </p>
            ) : null}
          </section>
        ) : null}

        {/* LOCAL SEO — only when SEO package is enabled --------------- */}
        {report.sections?.localSeo ? (
          <section className="report-section space-y-4">
            <SectionHeading kicker="Local SEO" title="Organic search performance" />
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Organic-source leads" value={report.sections.localSeo.organicLeads} />
              <Stat label="GSC impressions" value={report.sections.localSeo.gscImpressions ?? "—"} />
              <Stat label="GSC clicks" value={report.sections.localSeo.gscClicks ?? "—"} />
            </div>
            {report.sections.localSeo.gscImpressions == null ? (
              <p className="text-[10px] text-[var(--report-mute)] italic">
                Live Search Console impressions, clicks, and average position populate once GSC is
                connected on this customer&rsquo;s Search Console setup page.
              </p>
            ) : null}
          </section>
        ) : null}

        {/* GBP — only when GBP package is enabled --------------------- */}
        {report.sections?.gbp ? (
          <section className="report-section space-y-4">
            <SectionHeading kicker="Business Profile" title="Google Business Profile activity" />
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Tracked GBP calls" value={report.sections.gbp.trackingCalls} />
              <Stat label="Profile views" value={report.sections.gbp.profileViews ?? "—"} />
              <Stat label="Direction requests" value={report.sections.gbp.directionRequests ?? "—"} />
            </div>
            {report.sections.gbp.profileViews == null ? (
              <p className="text-[10px] text-[var(--report-mute)] italic">
                Live profile views and direction requests populate once Business Profile API is connected.
              </p>
            ) : null}
          </section>
        ) : null}

        {/* SPEND fallback — show when no service-tailored sections ---- */}
        {!report.sections?.googleAds &&
        !report.sections?.website &&
        !report.sections?.localSeo &&
        !report.sections?.gbp ? (
          <section className="report-section space-y-4">
            <SectionHeading kicker="Marketing spend" title="Spend &amp; efficiency" />
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Ad spend" value={formatMoney(totals.adSpend)} />
              <Stat label="Cost / lead" value={totals.leads > 0 ? formatMoney(totals.cpl) : "—"} />
              <Stat
                label="Cost / booked appt"
                value={totals.confirmedAppts > 0 ? formatMoney(totals.cpa) : "—"}
              />
            </div>
          </section>
        ) : null}

        {/* SOURCE BARS ------------------------------------------------ */}
        <section className="report-section space-y-4">
          <SectionHeading
            kicker="Acquisition channels"
            title="Where leads came from"
          />
          {leadsBySource.length === 0 ? (
            <p className="text-sm text-[var(--report-mute)]">No leads in this period.</p>
          ) : (
            <ul className="space-y-3">
              {leadsBySource.map((source, i) => {
                const widthPct = (source.count / maxSourceCount) * 100;
                const sharePct = ((source.count / totalLeads) * 100).toFixed(0);
                return (
                  <li key={source.source} className="space-y-1.5">
                    <div className="flex items-baseline justify-between text-[13px]">
                      <span className="font-medium">
                        {SOURCE_LABELS[source.source] ?? source.source}
                      </span>
                      <span className="tabular-nums text-[var(--report-mute)]">
                        <strong className="text-[var(--report-ink)]">{source.count}</strong>
                        <span className="ml-1 text-[11px]">({sharePct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#F1F5F9]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${widthPct}%`,
                          background:
                            i === 0
                              ? "linear-gradient(90deg, #F37021, #D85A0F)"
                              : "linear-gradient(90deg, #1E55C7, #143E96)",
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* STATUS GRID ------------------------------------------------ */}
        <section className="report-section space-y-4">
          <SectionHeading kicker="Pipeline" title="Lead outcomes" />
          {leadsByStatus.length === 0 ? (
            <p className="text-sm text-[var(--report-mute)]">No leads in this period.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {leadsByStatus.map((s) => (
                <div
                  key={s.status}
                  className="flex items-center justify-between rounded-md border border-[var(--report-line)] bg-[#F8FAFC] px-3 py-2.5 text-[13px]"
                >
                  <span className="text-[var(--report-mute)]">
                    {STATUS_LABELS[s.status] ?? s.status.replace(/_/g, " ").toLowerCase()}
                  </span>
                  <span className="font-bold tabular-nums">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* BILLING ---------------------------------------------------- */}
        {billing.length > 0 ? (
          <section className="report-section space-y-4">
            <SectionHeading kicker="Investment" title="Billing this month" />
            <table className="w-full border-separate border-spacing-0 text-[13px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.12em] text-[var(--report-mute)] font-semibold">
                  <th className="text-left pb-2 border-b border-[var(--report-line)]">Item</th>
                  <th className="text-left pb-2 border-b border-[var(--report-line)]">Status</th>
                  <th className="text-right pb-2 border-b border-[var(--report-line)]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {billing.map((b, i) => (
                  <tr
                    key={b.id}
                    className={i % 2 === 0 ? "" : "bg-[#F8FAFC]"}
                  >
                    <td className="py-2.5 px-2 border-b border-[var(--report-line)]">
                      <div className="font-medium capitalize">
                        {b.type.replace(/_/g, " ").toLowerCase()}
                      </div>
                      {b.description ? (
                        <div className="text-[11px] text-[var(--report-mute)] mt-0.5">
                          {b.description}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-2.5 px-2 border-b border-[var(--report-line)] text-[var(--report-mute)] capitalize">
                      {b.status.toLowerCase()}
                    </td>
                    <td className="py-2.5 px-2 border-b border-[var(--report-line)] text-right tabular-nums font-semibold">
                      {formatMoney(b.amount)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="pt-4 pb-1" />
                  <td className="pt-4 pb-1 text-right text-[10px] uppercase tracking-[0.12em] text-[var(--report-mute)] font-semibold pr-2">
                    Total
                  </td>
                  <td className="pt-4 pb-1 text-right text-base font-bold tabular-nums text-[var(--report-orange)] pr-2">
                    {formatMoney(billingTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        ) : null}

        {/* RECENT LEADS ----------------------------------------------- */}
        <section className="report-section space-y-4">
          <SectionHeading kicker="Activity" title="Recent leads" />
          {recentLeads.length === 0 ? (
            <p className="text-sm text-[var(--report-mute)]">No leads yet this month.</p>
          ) : (
            <ol className="text-[13px]">
              {recentLeads.slice(0, 12).map((l, i) => (
                <li
                  key={l.id}
                  className={
                    "py-2.5 flex items-baseline gap-3 " +
                    (i === 0 ? "" : "border-t border-[var(--report-line)]")
                  }
                >
                  <span className="text-[10px] text-[var(--report-mute)] tabular-nums w-6 font-semibold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">
                      {[l.firstName, l.lastName].filter(Boolean).join(" ") || "(unnamed)"}
                      {l.serviceRequested ? (
                        <span className="text-[var(--report-mute)] font-normal">
                          {" — "}
                          {l.serviceRequested}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[11px] text-[var(--report-mute)] mt-0.5">
                      {SOURCE_LABELS[l.source] ?? l.source.replace(/_/g, " ")}
                      {" · "}
                      {STATUS_LABELS[l.status] ?? l.status.replace(/_/g, " ").toLowerCase()}
                      {" · "}
                      {formatDate(l.createdAt)}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* FOOTER ----------------------------------------------------- */}
        <footer className="border-t border-[var(--report-line)] pt-5 mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-[var(--report-mute)]">
          <span>
            <strong className="text-[var(--report-ink)]">Trade Leads</strong> ·
            Lead Engine for contractors
          </span>
          <span>Confidential · {customer.businessName}</span>
        </footer>
      </article>
    </div>
  );
}

function Hero({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        "rounded-lg border p-4 " +
        (accent
          ? "border-[var(--report-orange)] bg-gradient-to-br from-[#F37021]/8 to-transparent"
          : "border-[var(--report-line)] bg-white")
      }
    >
      <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--report-mute)] font-bold">
        {label}
      </div>
      <div
        className={
          "mt-2 text-3xl font-bold tabular-nums leading-none " +
          (accent ? "text-[var(--report-orange)]" : "")
        }
      >
        {value}
      </div>
      <div className="mt-2 text-[11px] text-[var(--report-mute)] leading-tight">{hint}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-[var(--report-line)] bg-white px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--report-mute)] font-bold">
        {label}
      </div>
      <div className="mt-1 text-lg font-bold tabular-nums leading-tight">{value}</div>
    </div>
  );
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--report-orange)] font-bold">
        {kicker}
      </div>
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
    </div>
  );
}
