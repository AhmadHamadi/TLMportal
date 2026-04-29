import Link from "next/link";
import { adminOverviewStats } from "@/server/services/billing";
import { requireAdmin } from "@/lib/auth-guard";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  MessageSquare,
  Hash,
  ClipboardCheck,
  LineChart,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Overview - Admin" };

const opsLinks: { href: string; label: string; description: string; icon: LucideIcon }[] = [
  { href: "/admin/leads", label: "Qualify leads", description: "Review new forms, calls, SMS replies, and billable status.", icon: Inbox },
  { href: "/admin/calls", label: "Call tracking", description: "Audit call status, missed calls, and text-back recovery.", icon: Phone },
  { href: "/admin/sms", label: "SMS inbox", description: "Monitor lead availability, contractor replies, and follow-up.", icon: MessageSquare },
  { href: "/admin/appointments", label: "Booked appointments", description: "Confirm accepted opportunities before billing.", icon: CalendarCheck },
  { href: "/admin/disputes", label: "Disputes", description: "Resolve bad, wrong, or duplicate lead claims quickly.", icon: ShieldAlert },
  { href: "/admin/customers", label: "Customer onboarding", description: "Services, areas, contracts, Google access, tracking numbers.", icon: Users },
  { href: "/admin/tracking-numbers", label: "Tracking numbers", description: "Provision Twilio numbers and verify forwarding.", icon: Hash },
  { href: "/admin/reports", label: "Reports", description: "Show clients leads, calls, booked appointments, spend, and ROI.", icon: LineChart },
];

export default async function AdminOverviewPage() {
  const ctx = await requireAdmin();
  const stats = await adminOverviewStats(ctx);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agency command center</h1>
        <p className="text-sm text-muted-foreground">
          Qualify leads, protect billing, recover missed calls, and prove results for every contractor.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total customers" value={stats.totalCustomers} icon={Users} />
        <StatCard label="Active customers" value={stats.activeCustomers} icon={UserCheck} />
        <StatCard label="Leads this month" value={stats.leadsThisMonth} icon={Inbox} />
        <StatCard label="Forms this month" value={stats.formsThisMonth} icon={FileText} />
        <StatCard label="Calls this month" value={stats.callsThisMonth} icon={Phone} />
        <StatCard label="Confirmed appts" value={stats.confirmedThisMonth} icon={CalendarCheck} />
        <StatCard label="Billable appts" value={stats.billableThisMonth} icon={Receipt} />
        <StatCard label="Open disputes" value={stats.openDisputes} icon={ShieldAlert} />
        <StatCard label="MRR (retainers)" value={formatMoney(stats.monthlyRevenue)} icon={DollarSign} />
        <StatCard label="Appointment fees" value={formatMoney(stats.appointmentFeeRevenue)} icon={DollarSign} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            Daily operating hub
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {opsLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="group flex items-start gap-3 rounded-lg border bg-background p-3 transition hover:bg-muted/70">
                  <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{item.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{item.description}</span>
                  </span>
                  <ChevronRight className="mt-0.5 h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
