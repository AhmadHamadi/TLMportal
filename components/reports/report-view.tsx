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

const SOURCE_LABELS: Record<string, string> = {
  LANDING_PAGE_FORM: "Landing page",
  GOOGLE_ADS_LEAD_FORM: "Google Ads form",
  TRACKING_PHONE_CALL: "Phone call",
  SMS_REPLY: "SMS reply",
  MANUAL_ADMIN_ENTRY: "Manual entry",
  QUOTE_BUTTON: "Quote button",
};

export function ReportView({ report }: { report: MonthlyReport }) {
  const { customer, month, totals, leadsBySource, leadsByStatus, recentLeads, billing } = report;

  const totalLeads = totals.leads || 1; // div-zero guard for the bar chart
  const maxSourceCount = Math.max(1, ...leadsBySource.map((s) => s.count));

  const billingTotal = billing.reduce(
    (sum, b) => sum + Number(b.amount),
    0,
  );

  return (
    <div className="report-root">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body, html { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .report-page {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
          .report-section { page-break-inside: avoid; }
          @page { size: Letter; margin: 14mm 12mm; }
        }
        .report-page { font-feature-settings: "ss01", "cv11", "tnum"; }
      `}</style>

      <div className="no-print mb-4 flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Print or save as PDF (Ctrl/Cmd&nbsp;+&nbsp;P).
        </p>
        <Button onClick={() => window.print()} variant="outline" size="sm" className="gap-2">
          <Printer className="h-4 w-4" />
          Print / Save PDF
        </Button>
      </div>

      <article className="report-page mx-auto max-w-3xl rounded-xl border bg-card p-10 shadow-sm space-y-7">
        {/* HEADER ----------------------------------------------------- */}
        <header className="flex items-start justify-between gap-4 border-b pb-5">
          <div>
            <BrandMark size={36} wordmark="Trade Leads Marketing" />
            <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
              Monthly performance report
            </p>
          </div>
          <div className="text-right">
            <div className="font-display text-lg font-bold leading-tight">
              {customer.businessName}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{monthLabel(month)}</div>
            <div className="text-[10px] text-muted-foreground/70 mt-1">
              Generated {generatedOn()}
            </div>
          </div>
        </header>

        {/* KPI BAND --------------------------------------------------- */}
        <section className="report-section">
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-3">
            Headline numbers
          </h2>
          <div className="grid grid-cols-4 gap-2">
            <Kpi label="Leads" value={totals.leads} accent />
            <Kpi label="Calls" value={totals.callsCount} />
            <Kpi label="Confirmed" value={totals.confirmedAppts} />
            <Kpi label="Billable" value={totals.billableAppts} accent />
          </div>
        </section>

        {/* SPEND ------------------------------------------------------ */}
        <section className="report-section">
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-3">
            Spend &amp; efficiency
          </h2>
          <div className="grid grid-cols-4 gap-2">
            <Kpi label="Ad spend" value={formatMoney(totals.adSpend)} />
            <Kpi
              label="Cost / lead"
              value={totals.leads > 0 ? formatMoney(totals.cpl) : "—"}
            />
            <Kpi
              label="Cost / appt"
              value={totals.confirmedAppts > 0 ? formatMoney(totals.cpa) : "—"}
            />
            <Kpi
              label="Conversions"
              value={totals.adSpendConversions ?? "—"}
            />
          </div>
          {totals.adSpendImpressions || totals.adSpendClicks ? (
            <div className="mt-3 grid grid-cols-3 gap-3 text-[11px] text-muted-foreground">
              <span>Impressions: {(totals.adSpendImpressions ?? 0).toLocaleString()}</span>
              <span>Clicks: {(totals.adSpendClicks ?? 0).toLocaleString()}</span>
              <span>
                CTR:{" "}
                {totals.adSpendImpressions
                  ? (
                      (Number(totals.adSpendClicks ?? 0) /
                        Number(totals.adSpendImpressions)) *
                      100
                    ).toFixed(2) + "%"
                  : "—"}
              </span>
            </div>
          ) : null}
        </section>

        {/* SOURCE BARS ------------------------------------------------ */}
        <section className="report-section">
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-3">
            Where leads came from
          </h2>
          {leadsBySource.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads in this period.</p>
          ) : (
            <ul className="space-y-2">
              {leadsBySource.map((s) => {
                const widthPct = (s.count / maxSourceCount) * 100;
                const sharePct = ((s.count / totalLeads) * 100).toFixed(0);
                return (
                  <li key={s.source} className="text-[13px]">
                    <div className="flex items-baseline justify-between">
                      <span className="font-medium">{SOURCE_LABELS[s.source] ?? s.source}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {s.count} <span className="text-[11px]">({sharePct}%)</span>
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-[#F37021]"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* STATUS GRID ------------------------------------------------ */}
        <section className="report-section">
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-3">
            Lead outcomes
          </h2>
          {leadsByStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads in this period.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {leadsByStatus.map((s) => (
                <div
                  key={s.status}
                  className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-[13px]"
                >
                  <span className="text-muted-foreground">
                    {s.status.replace(/_/g, " ").toLowerCase()}
                  </span>
                  <span className="font-semibold tabular-nums">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* BILLING ---------------------------------------------------- */}
        {billing.length > 0 ? (
          <section className="report-section">
            <h2 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-3">
              Billing this month
            </h2>
            <table className="w-full text-[13px] border-separate border-spacing-0">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                  <th className="text-left font-medium pb-2 border-b">Item</th>
                  <th className="text-left font-medium pb-2 border-b">Status</th>
                  <th className="text-right font-medium pb-2 border-b">Amount</th>
                </tr>
              </thead>
              <tbody>
                {billing.map((b) => (
                  <tr key={b.id} className="align-top">
                    <td className="py-2 border-b">
                      <div className="font-medium">{b.type.replace(/_/g, " ").toLowerCase()}</div>
                      {b.description ? (
                        <div className="text-[11px] text-muted-foreground">{b.description}</div>
                      ) : null}
                    </td>
                    <td className="py-2 border-b text-muted-foreground">{b.status}</td>
                    <td className="py-2 border-b text-right tabular-nums font-medium">
                      {formatMoney(b.amount)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="pt-3" />
                  <td className="pt-3 text-right text-[11px] uppercase tracking-[0.06em] text-muted-foreground font-semibold">
                    Total
                  </td>
                  <td className="pt-3 text-right text-base font-bold tabular-nums text-[#F37021]">
                    {formatMoney(billingTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        ) : null}

        {/* RECENT LEADS ----------------------------------------------- */}
        <section className="report-section">
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-3">
            Recent leads
          </h2>
          {recentLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads yet this month.</p>
          ) : (
            <ol className="text-[13px] divide-y">
              {recentLeads.slice(0, 12).map((l, i) => (
                <li key={l.id} className="py-2 flex items-baseline gap-3">
                  <span className="text-[11px] text-muted-foreground/70 tabular-nums w-5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {[l.firstName, l.lastName].filter(Boolean).join(" ") || "(unnamed)"}
                      {l.serviceRequested ? (
                        <span className="text-muted-foreground font-normal">
                          {" · "}
                          {l.serviceRequested}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {SOURCE_LABELS[l.source] ?? l.source.replace(/_/g, " ")} ·{" "}
                      {l.status.replace(/_/g, " ").toLowerCase()} · {formatDate(l.createdAt)}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* FOOTER ----------------------------------------------------- */}
        <footer className="border-t pt-5 mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Trade Leads Marketing · Lead Engine for contractors</span>
          <span>Confidential · {customer.businessName}</span>
        </footer>
      </article>
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={
        "rounded-md border px-3 py-2.5 flex flex-col gap-0.5 " +
        (accent ? "border-[#F37021]/40 bg-[#F37021]/5" : "bg-card")
      }
    >
      <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-semibold">
        {label}
      </div>
      <div className="text-lg font-bold leading-tight tabular-nums">{value}</div>
    </div>
  );
}
