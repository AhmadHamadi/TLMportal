import Link from "next/link";
import { db } from "@/lib/db";
import { agencyRevenueStats } from "@/server/services/billing";
import { listCustomers } from "@/server/services/customers";
import { requireAdmin } from "@/lib/auth-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { startOfMonth } from "@/lib/dates";
import {
  Plus,
  Users,
  UserCheck,
  ChevronRight,
  Phone,
  Inbox,
  Sparkles,
  DollarSign,
} from "lucide-react";

export const metadata = { title: "Overview — Admin" };

export default async function AdminOverviewPage() {
  const ctx = await requireAdmin();
  const monthStart = startOfMonth();

  const [revenue, customers, perCustomerActivity] = await Promise.all([
    agencyRevenueStats(ctx),
    listCustomers(ctx),
    db.lead.groupBy({
      by: ["customerId"],
      where: { createdAt: { gte: monthStart }, deletedAt: null },
      _count: true,
    }),
  ]);

  const leadsByCustomer = new Map(
    perCustomerActivity.map((row) => [row.customerId, row._count]),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Open a customer to manage their leads, calls, SMS, billing, and integrations.
          </p>
        </div>
        <Link href="/admin/customers/new" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" /> New customer
        </Link>
      </div>

      {/* Quiet stats strip — agency-side numbers, not customer feeds */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Mini label="Customers" value={revenue.activeCustomers} icon={Users} />
        <Mini
          label="Leads this month"
          value={revenue.leadsThisMonth}
          icon={Inbox}
          accent
        />
        <Mini
          label="Contracted MRR"
          value={formatMoney(revenue.contractedMRR)}
          icon={DollarSign}
        />
        <Mini
          label="Collected"
          value={formatMoney(revenue.totalRevenue)}
          icon={UserCheck}
        />
      </div>

      {/* Customer cards — primary surface */}
      {customers.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <Users className="h-8 w-8 text-muted-foreground mx-auto" />
            <h3 className="text-base font-medium">No customers yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Add your first contractor customer to start tracking leads.
            </p>
            <Link href="/admin/customers/new" className={buttonVariants()}>
              <Plus className="h-4 w-4 mr-2" /> Add customer
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {customers.map((c) => {
            const leadsThisMonth = leadsByCustomer.get(c.id) ?? 0;
            return (
              <Card key={c.id} className="hover:border-primary/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base font-semibold truncate">
                        {c.businessName}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.contactName} · {c.email}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {leadsThisMonth} leads this month
                    </span>
                    <span>·</span>
                    <span>Retainer {formatMoney(c.monthlyRetainer)}</span>
                    {Number(c.appointmentFee) > 0 ? (
                      <>
                        <span>·</span>
                        <span>{formatMoney(c.appointmentFee)} / appt</span>
                      </>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className={buttonVariants({ size: "sm" })}
                    >
                      Open
                      <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                    </Link>
                    <Link
                      href={`/admin/customers/${c.id}/twilio`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      <Phone className="h-3.5 w-3.5 mr-1" />
                      Twilio
                    </Link>
                    <Link
                      href={`/admin/customers/${c.id}/google-ads`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Google Ads
                    </Link>
                    <Link
                      href={`/admin/customers/${c.id}/ad-recommendations`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                      AI recos
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Mini({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <div
      className={
        "rounded-md border bg-card p-3 flex items-center justify-between gap-2 " +
        (accent ? "border-[#F37021]/40 bg-[#F37021]/5" : "")
      }
    >
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-semibold">
          {label}
        </div>
        <div className="text-base font-bold tabular-nums leading-tight mt-0.5">
          {value}
        </div>
      </div>
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
    </div>
  );
}
