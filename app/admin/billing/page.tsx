import {
  agencyRevenueStats,
  listBillingRecords,
} from "@/server/services/billing";
import { requireAdmin } from "@/lib/auth-guard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import {
  TrendingUp,
  Inbox,
  DollarSign,
  Receipt,
  CalendarCheck,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export const metadata = { title: "Billing — Admin" };

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map((s) => parseInt(s, 10));
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

export default async function AdminBillingPage() {
  const ctx = await requireAdmin();
  const [records, stats] = await Promise.all([
    listBillingRecords(ctx),
    agencyRevenueStats(ctx),
  ]);

  const deltaNum = parseInt(stats.leadsDeltaPct, 10);
  const deltaPositive = deltaNum >= 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agency revenue</h1>
        <p className="text-sm text-muted-foreground">
          {monthLabel(stats.month)} · subscription income, appointment fees, and lead volume —
          how the agency itself is earning.
        </p>
      </div>

      {/* HEADLINE NUMBERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RevenueCard
          label="Contracted MRR"
          value={formatMoney(stats.contractedMRR)}
          hint={`${stats.activeCustomers} active customers · monthly retainers + SEO`}
          accent
          icon={DollarSign}
        />
        <RevenueCard
          label="Collected this month"
          value={formatMoney(stats.totalRevenue)}
          hint={`${formatMoney(stats.paidRetainer)} retainer + ${formatMoney(stats.paidAppointmentFees)} appt fees`}
          icon={TrendingUp}
        />
        <RevenueCard
          label="Pending invoice"
          value={formatMoney(stats.pending)}
          hint="Approved or awaiting Stripe sync"
          icon={Clock}
        />
      </div>

      {/* SECONDARY KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Mini
          icon={Inbox}
          label="Leads this month"
          value={stats.leadsThisMonth}
          delta={
            <span
              className={
                deltaPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }
            >
              {deltaPositive ? (
                <ArrowUpRight className="inline h-3 w-3" />
              ) : (
                <ArrowDownRight className="inline h-3 w-3" />
              )}
              {Math.abs(deltaNum)}% vs last
            </span>
          }
        />
        <Mini
          icon={CalendarCheck}
          label="Booked appts"
          value={stats.confirmedThisMonth}
        />
        <Mini icon={Receipt} label="Billable appts" value={stats.billableThisMonth} />
        <Mini
          icon={DollarSign}
          label="Revenue / lead"
          value={formatMoney(stats.revenuePerLead)}
        />
      </div>

      {/* PROFIT FRAMING */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Quick profit read
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Agency made <strong>{formatMoney(stats.totalRevenue)}</strong> this month from{" "}
            <strong>{stats.activeCustomers}</strong> contractor{stats.activeCustomers === 1 ? "" : "s"}.
            Generated <strong>{stats.leadsThisMonth}</strong> leads (
            {deltaPositive ? "+" : ""}{stats.leadsDeltaPct}% vs last month).
          </p>
          <p className="text-muted-foreground text-xs">
            Subtract your monthly costs (Vercel + Neon + Twilio + Stripe + Resend + your time)
            to get net profit. The portal infrastructure runs ~$30–80/mo at this scale; your time
            is the main variable cost.
          </p>
        </CardContent>
      </Card>

      {/* RECORDS */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-3">Billing records</h2>
        {records.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No billing records yet — they appear when retainers run or appointment fees are approved.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-md border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm font-mono">{r.billingMonth}</TableCell>
                    <TableCell className="text-sm">{r.customer.businessName}</TableCell>
                    <TableCell className="text-sm">
                      {r.type.replace(/_/g, " ").toLowerCase()}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMoney(r.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(r.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function RevenueCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <Card
      className={
        accent
          ? "border-[#F37021]/40 bg-gradient-to-br from-[#F37021]/8 to-transparent"
          : ""
      }
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-semibold">
            {label}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        <div
          className={
            "text-3xl font-bold tabular-nums leading-tight " +
            (accent ? "text-[#F37021]" : "")
          }
        >
          {value}
        </div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function Mini({
  icon: Icon,
  label,
  value,
  delta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  delta?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-semibold">
          {label}
        </div>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="mt-1 text-lg font-bold tabular-nums leading-tight">{value}</div>
      {delta ? <div className="text-[11px] mt-1">{delta}</div> : null}
    </div>
  );
}
