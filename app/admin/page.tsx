import Link from "next/link";
import { adminOverviewStats } from "@/server/services/billing";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime } from "@/lib/dates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  Inbox,
  CalendarCheck,
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
  { href: "/admin/leads", label: "Leads", description: "Review new forms, calls, SMS replies, and follow-up.", icon: Inbox },
  { href: "/admin/calls", label: "Call tracking", description: "Audit call status, missed calls, and text-back recovery.", icon: Phone },
  { href: "/admin/sms", label: "SMS inbox", description: "Monitor lead availability, contractor replies, and follow-up.", icon: MessageSquare },
  { href: "/admin/appointments", label: "Booked appointments", description: "See requested, accepted, and confirmed estimate appointments.", icon: CalendarCheck },
  { href: "/admin/customers", label: "Customer onboarding", description: "Services, areas, contracts, Google access, tracking numbers.", icon: Users },
  { href: "/admin/tracking-numbers", label: "Tracking numbers", description: "Provision Twilio numbers and verify forwarding.", icon: Hash },
  { href: "/admin/reports", label: "Reports", description: "Show clients leads, calls, booked appointments, spend, and ROI.", icon: LineChart },
];

export default async function AdminOverviewPage() {
  const ctx = await requireAdmin();
  const [stats, notifications] = await Promise.all([
    adminOverviewStats(ctx),
    db.notification.findMany({
      where: { status: "UNREAD" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { customer: { select: { businessName: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agency command center</h1>
        <p className="text-sm text-muted-foreground">
          Track leads, book estimate appointments, recover missed calls, and prove results for every contractor.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total customers" value={stats.totalCustomers} icon={Users} />
        <StatCard label="Active customers" value={stats.activeCustomers} icon={UserCheck} />
        <StatCard label="Leads this month" value={stats.leadsThisMonth} icon={Inbox} />
        <StatCard label="Forms this month" value={stats.formsThisMonth} icon={FileText} />
        <StatCard label="Calls this month" value={stats.callsThisMonth} icon={Phone} />
        <StatCard label="Booked appts" value={stats.confirmedThisMonth} icon={CalendarCheck} />
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

      <Card>
        <CardHeader>
          <CardTitle>Admin notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No unread admin notifications.</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.link ?? "/admin"}
                  className="block rounded-lg border bg-background p-3 transition hover:bg-muted/70"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{notification.title}</p>
                    <StatusBadge status={notification.category} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {notification.customer?.businessName ?? "System"} - {formatDateTime(notification.createdAt)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
