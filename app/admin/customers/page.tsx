import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { listCustomers } from "@/server/services/customers";
import { requireAdmin } from "@/lib/auth-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatMoney } from "@/lib/money";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Plus,
  Check,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "Customers — Admin" };

const PACKAGE_LABELS: Record<string, string> = {
  leadEngine: "Lead Engine",
  googleAds: "Google Ads",
  website: "Website / landing page",
  localSeo: "Local SEO",
  gbp: "GBP",
};

export default async function CustomersPage() {
  const ctx = await requireAdmin();
  const customers = await listCustomers(ctx);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Click a customer to open their dashboard.
          </p>
        </div>
        <Link href="/admin/customers/new" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />
          New customer
        </Link>
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Add your first contractor customer to start tracking leads."
          action={
            <Link href="/admin/customers/new" className={buttonVariants()}>
              Add customer
            </Link>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0 divide-y">
            {customers.map((c) => {
              const packages: { key: string; on: boolean }[] = [
                { key: "leadEngine", on: c.leadEngineEnabled },
                { key: "googleAds", on: c.googleAdsEnabled },
                { key: "website", on: c.websiteEnabled },
                { key: "localSeo", on: c.localSeoEnabled },
                { key: "gbp", on: c.gbpEnabled },
              ];
              return (
                <Link
                  key={c.id}
                  href={`/admin/customers/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{c.businessName}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {c.contactName} · Retainer {formatMoney(c.monthlyRetainer)}
                      {Number(c.appointmentFee) > 0 ? (
                        <> · {formatMoney(c.appointmentFee)} / appt</>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {packages.map((p) => (
                        <span
                          key={p.key}
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px]",
                            p.on
                              ? "text-emerald-600 dark:text-emerald-400 font-medium"
                              : "text-muted-foreground/60",
                          )}
                        >
                          {p.on ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <span className="inline-block h-3 w-3 rounded-full border border-muted-foreground/30" />
                          )}
                          {PACKAGE_LABELS[p.key]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
