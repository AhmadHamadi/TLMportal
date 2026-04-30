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
  LANDING_PAGE_FORM: "Landing page",
  GOOGLE_ADS_LEAD_FORM: "Google Ads form",
  TRACKING_PHONE_CALL: "Phone call",
  SMS_REPLY: "SMS reply",
  MANUAL_ADMIN_ENTRY: "Manual entry",
  QUOTE_BUTTON: "Quote button",
};

function monthLabel(month: string): string {
  const [year, monthIndex] = month.split("-").map((part) => parseInt(part, 10));
  return `${MONTH_NAMES[monthIndex - 1]} ${year}`;
}

function generatedOn(): string {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());
}

export function ReportView({ report }: { report: MonthlyReport }) {
  const { customer, month, totals, leadsBySource, leadsByStatus, recentLeads, billing } = report;
  const totalLeads = totals.leads || 1;
  const maxSourceCount = Math.max(1, ...leadsBySource.map((source) => source.count));
  const billingTotal = billing.reduce((sum, row) => sum + Number(row.amount), 0);

  return (
    <div className="report-root">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body, html { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .report-page { box-shadow: none !important; border: none !important; padding: 0 !important; max-width: 100% !important; margin: 0 !important; }
          .report-section { page-break-inside: avoid; }
          @page { size: Letter; margin: 14mm 12mm; }
        }
        .report-page { font-feature-settings: "ss01", "cv11", "tnum"; }
      `}</style>

      <div className="no-print mb-4 flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Print or save as PDF.</p>
        <Button onClick={() => window.print()} variant="outline" size="sm" className="gap-2">
          <Printer className="h-4 w-4" />
          Print / Save PDF
        </Button>
      </div>

      <article className="report-page mx-auto max-w-3xl rounded-xl border bg-card p-10 shadow-sm space-y-7">
        <header className="flex items-start justify-between gap-4 border-b pb-5">
          <div>
            <BrandMark size={36} wordmark="Trade Leads Marketing" />
            <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
              Monthly performance report
            </p>
          </div>
          <div className="text-right">
            <div className="font-display text-lg font-bold leading-tight">{customer.businessName}</div>
            <div className="text-xs text-muted-foreground mt-1">{monthLabel(month)}</div>
            <div className="text-[10px] text-muted-foreground/70 mt-1">Generated {generatedOn()}</div>
          </div>
        </header>

        <section className="report-section">
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-3">
            Simple scorecard
          </h2>
          <div className="grid grid-cols-4 gap-2">
            <Kpi label="Leads" value={totals.leads} accent />
            <Kpi label="Calls" value={totals.callsCount} />
            <Kpi label="Booked appts" value={totals.confirmedAppts} accent />
            <Kpi label="Ad conversions" value={totals.adSpendConversions ?? "-"} />
          </div>
        </section>

        <section className="report-section">
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-3">
            Spend and efficiency
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <Kpi label="Ad spend" value={formatMoney(totals.adSpend)} />
            <Kpi label="Cost / lead" value={totals.leads > 0 ? formatMoney(totals.cpl) : "-"} />
            <Kpi label="Cost / booked appt" value={totals.confirmedAppts > 0 ? formatMoney(totals.cpa) : "-"} />
          </div>
          {totals.adSpendImpressions || totals.adSpendClicks ? (
            <div className="mt-3 grid grid-cols-3 gap-3 text-[11px] text-muted-foreground">
              <span>Impressions: {(totals.adSpendImpressions ?? 0).toLocaleString()}</span>
              <span>Clicks: {(totals.adSpendClicks ?? 0).toLocaleString()}</span>
              <span>
                CTR: {totals.adSpendImpressions
                  ? (((totals.adSpendClicks ?? 0) / totals.adSpendImpressions) * 100).toFixed(2) + "%"
                  : "-"}
              </span>
            </div>
          ) : null}
        </section>

        <section className="report-section">
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-3">
            Where leads came from
          </h2>
          {leadsBySource.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads in this period.</p>
          ) : (
            <ul className="space-y-2">
              {leadsBySource.map((source) => {
                const widthPct = (source.count / maxSourceCount) * 100;
                const sharePct = ((source.count / totalLeads) * 100).toFixed(0);
                return (
                  <li key={source.source} className="text-[13px]">
                    <div className="flex items-baseline justify-between">
                      <span className="font-medium">{SOURCE_LABELS[source.source] ?? source.source}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {source.count} <span className="text-[11px]">({sharePct}%)</span>
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-[#F37021]" style={{ width: `${widthPct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="report-section">
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-3">
            Lead status snapshot
          </h2>
          {leadsByStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads in this period.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {leadsByStatus.map((status) => (
                <div key={status.status} className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-[13px]">
                  <span className="text-muted-foreground">{status.status.replace(/_/g, " ").toLowerCase()}</span>
                  <span className="font-semibold tabular-nums">{status.count}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {billing.length > 0 ? (
          <section className="report-section">
            <h2 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-3">
              Billing this month
            </h2>
            <table className="w-full border-separate border-spacing-0 text-[13px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                  <th className="border-b pb-2 text-left font-medium">Item</th>
                  <th className="border-b pb-2 text-left font-medium">Status</th>
                  <th className="border-b pb-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {billing.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="border-b py-2">
                      <div className="font-medium">{row.type.replace(/_/g, " ").toLowerCase()}</div>
                      {row.description ? <div className="text-[11px] text-muted-foreground">{row.description}</div> : null}
                    </td>
                    <td className="border-b py-2 text-muted-foreground">{row.status}</td>
                    <td className="border-b py-2 text-right font-medium tabular-nums">{formatMoney(row.amount)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="pt-3" />
                  <td className="pt-3 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Total</td>
                  <td className="pt-3 text-right text-base font-bold tabular-nums text-[#F37021]">{formatMoney(billingTotal)}</td>
                </tr>
              </tbody>
            </table>
          </section>
        ) : null}

        <section className="report-section">
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-3">
            Recent leads
          </h2>
          {recentLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads yet this month.</p>
          ) : (
            <ol className="divide-y text-[13px]">
              {recentLeads.slice(0, 12).map((lead, index) => (
                <li key={lead.id} className="flex items-baseline gap-3 py-2">
                  <span className="w-5 text-[11px] tabular-nums text-muted-foreground/70">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">
                      {[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "(unnamed)"}
                      {lead.serviceRequested ? <span className="font-normal text-muted-foreground"> - {lead.serviceRequested}</span> : null}
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {SOURCE_LABELS[lead.source] ?? lead.source.replace(/_/g, " ")} - {lead.status.replace(/_/g, " ").toLowerCase()} - {formatDate(lead.createdAt)}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <footer className="mt-2 flex items-center justify-between border-t pt-5 text-[11px] text-muted-foreground">
          <span>Trade Leads Marketing - Lead Engine for contractors</span>
          <span>Confidential - {customer.businessName}</span>
        </footer>
      </article>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className={"flex flex-col gap-0.5 rounded-md border px-3 py-2.5 " + (accent ? "border-[#F37021]/40 bg-[#F37021]/5" : "bg-card")}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</div>
      <div className="text-lg font-bold leading-tight tabular-nums">{value}</div>
    </div>
  );
}
