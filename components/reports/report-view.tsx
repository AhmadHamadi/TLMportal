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

export function ReportView({ report }: { report: MonthlyReport }) {
  const { customer, month, totals, leadsBySource, leadsByStatus, recentLeads, billing } = report;
  return (
    <div className="report-root">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body, html { background: white !important; }
          .report-page { box-shadow: none !important; border: none !important; padding: 0 !important; }
        }
      `}</style>

      <div className="no-print mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Print or save as PDF using your browser&rsquo;s print dialog (Ctrl/Cmd&nbsp;+&nbsp;P).
        </p>
        <Button onClick={() => window.print()} variant="outline" size="sm" className="gap-2">
          <Printer className="h-4 w-4" />
          Print / Save PDF
        </Button>
      </div>

      <article className="report-page mx-auto max-w-3xl rounded-lg border bg-card p-8 shadow-sm space-y-8">
        <header className="flex items-start justify-between border-b pb-5">
          <div>
            <BrandMark size={36} wordmark="Trade Leads Marketing" />
            <p className="text-xs text-muted-foreground mt-1">Monthly performance report</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold">{customer.businessName}</div>
            <div className="text-xs text-muted-foreground">{monthLabel(month)}</div>
          </div>
        </header>

        <section>
          <h2 className="text-base font-semibold tracking-tight mb-3">Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Leads" value={totals.leads} />
            <Stat label="Calls" value={totals.callsCount} />
            <Stat label="Confirmed" value={totals.confirmedAppts} />
            <Stat label="Billable" value={totals.billableAppts} />
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold tracking-tight mb-3">Spend &amp; efficiency</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Ad spend" value={formatMoney(totals.adSpend)} />
            <Stat
              label="Cost / lead"
              value={totals.leads > 0 ? formatMoney(totals.cpl) : "—"}
            />
            <Stat
              label="Cost / appt"
              value={totals.confirmedAppts > 0 ? formatMoney(totals.cpa) : "—"}
            />
            <Stat
              label="Conversions"
              value={totals.adSpendConversions ?? "—"}
            />
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold tracking-tight mb-3">Where leads came from</h2>
          <Table
            rows={leadsBySource.map((s) => [s.source.replace(/_/g, " "), s.count])}
            empty="No leads in this period."
          />
        </section>

        <section>
          <h2 className="text-base font-semibold tracking-tight mb-3">Lead outcomes</h2>
          <Table
            rows={leadsByStatus.map((s) => [s.status.replace(/_/g, " "), s.count])}
            empty="No leads in this period."
          />
        </section>

        {billing.length > 0 ? (
          <section>
            <h2 className="text-base font-semibold tracking-tight mb-3">Billing this month</h2>
            <Table
              rows={billing.map((b) => [
                `${b.type.replace(/_/g, " ")}${b.description ? ` — ${b.description}` : ""}`,
                `${formatMoney(b.amount)} · ${b.status}`,
              ])}
              empty="No billing rows."
            />
          </section>
        ) : null}

        <section>
          <h2 className="text-base font-semibold tracking-tight mb-3">Recent leads</h2>
          <ol className="space-y-1.5 text-sm list-decimal list-inside">
            {recentLeads.length === 0 ? (
              <li className="text-muted-foreground list-none">No leads yet this month.</li>
            ) : (
              recentLeads.slice(0, 12).map((l) => (
                <li key={l.id}>
                  <span className="font-medium">
                    {[l.firstName, l.lastName].filter(Boolean).join(" ") || "(unnamed)"}
                  </span>{" "}
                  · {l.serviceRequested ?? "—"} ·{" "}
                  <span className="text-muted-foreground">
                    {l.source.replace(/_/g, " ")} · {l.status.replace(/_/g, " ")} ·{" "}
                    {formatDate(l.createdAt)}
                  </span>
                </li>
              ))
            )}
          </ol>
        </section>

        <footer className="border-t pt-4 text-xs text-muted-foreground">
          Prepared by Trade Leads Marketing for {customer.businessName}.
        </footer>
      </article>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}

function Table({ rows, empty }: { rows: [string, React.ReactNode][]; empty: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(([k, v], i) => (
          <tr key={i} className="border-b last:border-b-0">
            <td className="py-1.5 text-muted-foreground">{k}</td>
            <td className="py-1.5 text-right font-medium">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
