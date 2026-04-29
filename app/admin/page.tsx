import { adminOverviewStats } from "@/server/services/billing";
import { requireAdmin } from "@/lib/auth-guard";
import { StatCard } from "@/components/shared/stat-card";
import {
  Users,
  UserCheck,
  Inbox,
  CalendarCheck,
  Receipt,
  ShieldAlert,
  Phone,
  FileText,
  DollarSign,
} from "lucide-react";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Overview — Admin" };

export default async function AdminOverviewPage() {
  const ctx = await requireAdmin();
  const stats = await adminOverviewStats(ctx);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">Agency performance this month.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total customers" value={stats.totalCustomers} icon={Users} />
        <StatCard label="Active customers" value={stats.activeCustomers} icon={UserCheck} />
        <StatCard label="Leads this month" value={stats.leadsThisMonth} icon={Inbox} />
        <StatCard label="Forms this month" value={stats.formsThisMonth} icon={FileText} />
        <StatCard label="Calls this month" value={stats.callsThisMonth} icon={Phone} />
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
        <StatCard label="Open disputes" value={stats.openDisputes} icon={ShieldAlert} />
        <StatCard
          label="MRR (retainers)"
          value={formatMoney(stats.monthlyRevenue)}
          icon={DollarSign}
        />
        <StatCard
          label="Appointment fees"
          value={formatMoney(stats.appointmentFeeRevenue)}
          icon={DollarSign}
        />
      </div>
    </div>
  );
}
