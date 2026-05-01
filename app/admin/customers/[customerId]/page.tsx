import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCustomerById } from "@/server/services/customers";
import { requireAdmin } from "@/lib/auth-guard";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatMoney } from "@/lib/money";
import { formatDate, startOfMonth } from "@/lib/dates";
import { formatNational } from "@/lib/phone";
import {
  Phone,
  MapPin,
  Search,
  Inbox,
  CalendarCheck,
  Receipt,
  CheckCircle2,
  Circle,
  Sparkles,
  FileText,
  ChevronRight,
  Settings as SettingsIcon,
  ExternalLink,
} from "lucide-react";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const ctx = await requireAdmin();
  const customer = await getCustomerById(ctx, customerId);
  if (!customer) notFound();

  const monthStart = startOfMonth();
  const [leadsThisMonth, callsThisMonth, billableAppts, recentLeads, billing] =
    await Promise.all([
      db.lead.count({
        where: { customerId, createdAt: { gte: monthStart }, deletedAt: null },
      }),
      db.callLog.count({ where: { customerId, createdAt: { gte: monthStart } } }),
      db.appointment.count({
        where: { customerId, createdAt: { gte: monthStart }, isBillable: true },
      }),
      db.lead.findMany({
        where: { customerId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          serviceRequested: true,
          source: true,
          status: true,
          createdAt: true,
        },
      }),
      db.billingRecord.aggregate({
        where: {
          customerId,
          billingMonth: `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, "0")}`,
          status: { in: ["PAID", "INVOICED", "APPROVED"] },
        },
        _sum: { amount: true },
      }),
    ]);

  const billingThisMonth = billing._sum.amount?.toString() ?? "0";

  const packages: { label: string; on: boolean }[] = [
    { label: "Lead Engine", on: customer.leadEngineEnabled },
    { label: "Google Ads", on: customer.googleAdsEnabled },
    { label: "Website / landing page", on: customer.websiteEnabled },
    { label: "Local SEO", on: customer.localSeoEnabled },
    { label: "Google Business Profile", on: customer.gbpEnabled },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER --------------------------------------------------- */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">{customer.businessName}</h1>
            <StatusBadge status={customer.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {customer.contactName} · {customer.email} · {formatNational(customer.phone)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/onboarding/${customer.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Onboarding
          </Link>
          <Link
            href={`/admin/customers/${customer.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <SettingsIcon className="h-3.5 w-3.5 mr-1" />
            Edit
          </Link>
        </div>
      </div>

      {/* THIS MONTH ----------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={Inbox} label="Leads" value={leadsThisMonth} />
        <Stat icon={Phone} label="Calls" value={callsThisMonth} />
        <Stat icon={CalendarCheck} label="Billable appts" value={billableAppts} />
        <Stat
          icon={Receipt}
          label="Billed this month"
          value={formatMoney(billingThisMonth)}
        />
      </div>

      {/* PACKAGES ------------------------------------------------- */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-bold">
            Active packages
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
            {packages.map((p) => (
              <li
                key={p.label}
                className="flex items-center gap-2 text-sm"
              >
                {p.on ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                )}
                <span className={p.on ? "" : "text-muted-foreground"}>{p.label}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* INTEGRATIONS GRID ---------------------------------------- */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-bold mb-2">
          Integrations
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <IntegrationTile
            href={`/admin/customers/${customer.id}/twilio`}
            icon={Phone}
            label="Twilio"
            hint={`${customer.trackingNumbers.length} number${customer.trackingNumbers.length === 1 ? "" : "s"}`}
            color="#F37021"
          />
          <IntegrationTile
            href={`/admin/customers/${customer.id}/google-ads`}
            icon={() => (
              <span className="text-[10px] font-bold tracking-wider">ADS</span>
            )}
            label="Google Ads"
            hint={
              customer.googleAdsCustomerId
                ? customer.googleAdsCustomerId
                : "Not linked"
            }
            color="#1E55C7"
          />
          <IntegrationTile
            href={`/admin/customers/${customer.id}/google-business-profile`}
            icon={MapPin}
            label="Business Profile"
            hint={customer.gbpEnabled ? "Active" : "Not enabled"}
            color="#1E8E3E"
          />
          <IntegrationTile
            href={`/admin/customers/${customer.id}/google-search-console`}
            icon={Search}
            label="Search Console"
            hint={customer.websiteUrl ? customer.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") : "No site set"}
            color="#4285F4"
          />
        </div>
      </div>

      {/* TOOLS ROW ------------------------------------------------ */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-bold mb-2">
          Tools
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ToolTile
            href={`/admin/customers/${customer.id}/ad-recommendations`}
            icon={Sparkles}
            label="AI ad recommendations"
            hint="Claude reads landing page + metrics"
          />
          <ToolTile
            href={`/admin/reports/${customer.id}/${new Date().toISOString().slice(0, 7)}`}
            icon={FileText}
            label="Monthly report"
            hint="Branded PDF for the contractor"
          />
          <ToolTile
            href={`/admin/customers/${customer.id}/contract/msa-v1`}
            icon={FileText}
            label="Generate MSA"
            hint="Auto-filled signing copy"
          />
        </div>
      </div>

      {/* RECENT LEADS --------------------------------------------- */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-bold mb-2">
          Recent leads
        </div>
        <Card>
          <CardContent className="p-0 divide-y">
            {recentLeads.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No leads yet for this customer.
              </div>
            ) : (
              recentLeads.map((l) => (
                <Link
                  key={l.id}
                  href={`/admin/leads/${l.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {[l.firstName, l.lastName].filter(Boolean).join(" ") || "Unnamed lead"}
                      {l.serviceRequested ? (
                        <span className="text-muted-foreground font-normal">
                          {" — "}
                          {l.serviceRequested}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {l.source.replace(/_/g, " ").toLowerCase()} ·{" "}
                      {l.status.replace(/_/g, " ").toLowerCase()} · {formatDate(l.createdAt)}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* QUICK INFO STRIP ----------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <InfoCard label="Monthly retainer" value={formatMoney(customer.monthlyRetainer)} />
        <InfoCard
          label="Appointment fee"
          value={
            customer.leadEngineEnabled && Number(customer.appointmentFee) > 0
              ? formatMoney(customer.appointmentFee)
              : "—"
          }
        />
        <InfoCard
          label="Forwarding phone"
          value={
            customer.forwardingPhone ? (
              <a
                href={`tel:${customer.forwardingPhone}`}
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                {formatNational(customer.forwardingPhone)}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              "—"
            )
          }
        />
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-md border bg-card p-3 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-semibold">
          {label}
        </div>
        <div className="text-base font-bold tabular-nums leading-tight mt-0.5 truncate">
          {value}
        </div>
      </div>
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
    </div>
  );
}

function IntegrationTile({
  href,
  icon: Icon,
  label,
  hint,
  color,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-md border bg-card p-3 hover:border-primary/40 transition-colors flex items-center gap-3"
    >
      <div
        className="shrink-0 h-8 w-8 rounded-md flex items-center justify-center"
        style={{ background: `${color}1A`, color }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{label}</div>
        <div className="text-[11px] text-muted-foreground truncate">{hint}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function ToolTile({
  href,
  icon: Icon,
  label,
  hint,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-md border bg-card p-3 hover:border-primary/40 transition-colors flex items-center gap-3"
    >
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{label}</div>
        <div className="text-[11px] text-muted-foreground truncate">{hint}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-semibold">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}
