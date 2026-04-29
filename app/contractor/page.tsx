import { contractorOverviewStats } from "@/server/services/billing";
import { requireContractor } from "@/lib/auth-guard";
import { StatCard } from "@/components/shared/stat-card";
import {
  Inbox,
  Phone,
  CalendarCheck,
  Receipt,
  DollarSign,
  LineChart,
} from "lucide-react";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Overview — TLM Portal" };

export default async function ContractorOverview() {
  const ctx = await requireContractor();
  const stats = await contractorOverviewStats(ctx);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">This month</h1>
        <p className="text-sm text-muted-foreground">
          Your lead, appointment, and billing activity.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Leads" value={stats.leadsThisMonth} icon={Inbox} />
        <StatCard label="Calls" value={stats.callsThisMonth} icon={Phone} />
        <StatCard
          label="Confirmed appts"
          value={stats.confirmedThisMonth}
          icon={CalendarCheck}
        />
        <StatCard
          label="Billable appts"
          value={stats.billableThisMonth}
          icon={Receipt}
        />
        <StatCard
          label="Estimated charges"
          value={formatMoney(stats.estimatedCharges)}
          hint="Pending + approved appointment fees"
          icon={DollarSign}
        />
        <StatCard
          label="Paid this month"
          value={formatMoney(stats.paidThisMonth)}
          icon={DollarSign}
        />
        <StatCard
          label="Ad spend"
          value={formatMoney(stats.adSpend)}
          hint="As entered by your account manager"
          icon={LineChart}
        />
        <StatCard
          label="Cost per lead / appt"
          value={`${formatMoney(stats.costPerLead)} / ${formatMoney(stats.costPerAppointment)}`}
        />
      </div>
    </div>
  );
}
