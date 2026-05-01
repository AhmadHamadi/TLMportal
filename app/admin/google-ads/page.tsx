import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatMoney } from "@/lib/money";
import { ChevronRight, AlertCircle, Sparkles } from "lucide-react";

export const metadata = { title: "Google Ads — Admin" };

export default async function GoogleAdsOverviewPage() {
  await requireAdmin();

  const customers = await db.customer.findMany({
    where: { deletedAt: null },
    orderBy: [{ status: "asc" }, { businessName: "asc" }],
    select: {
      id: true,
      businessName: true,
      contactName: true,
      googleAdsCustomerId: true,
      googleAdsLinkStatus: true,
      googleAdsBudgetCurrency: true,
      monthlyAdBudget: true,
      googleAdsEnabled: true,
      status: true,
    },
  });

  const linked = customers.filter((c) => c.googleAdsLinkStatus === "LINKED").length;
  const total = customers.length;
  const billingCustomers = customers.filter((c) => c.googleAdsEnabled);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Google Ads</h1>
          <p className="text-sm text-muted-foreground">
            Map each contractor to their Google Ads Customer ID under your manager (MCC). Click a
            customer to configure their account ID, currency, and monthly budget.
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div>
            <strong className="text-foreground tabular-nums">{linked}</strong> of{" "}
            <strong className="text-foreground tabular-nums">{total}</strong> customers linked
          </div>
        </div>
      </div>

      {billingCustomers.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No customers have the <strong>Google Ads management</strong> package enabled yet.
            Enable it on a customer&rsquo;s Edit page (<em>Packages</em> section) so they show up
            here as billable.
          </AlertDescription>
        </Alert>
      ) : null}

      {customers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No customers yet. Add one to start linking Google Ads accounts.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border bg-card overflow-hidden">
          <ul className="divide-y">
            {customers.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/customers/${c.id}/google-ads`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="hidden sm:flex shrink-0 h-9 w-9 items-center justify-center rounded-md bg-[#1E55C7]/10 text-[#1E55C7] text-[10px] font-bold tracking-wider">
                    ADS
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[2fr_1.5fr_1.2fr_1fr] gap-3 items-center">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{c.businessName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {c.contactName}
                        {!c.googleAdsEnabled ? (
                          <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                            no package
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-xs font-mono">
                      {c.googleAdsCustomerId ? (
                        c.googleAdsCustomerId
                      ) : (
                        <span className="text-muted-foreground font-sans">No CID set</span>
                      )}
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">Budget </span>
                      <span className="font-semibold tabular-nums">
                        {formatMoney(c.monthlyAdBudget)} {c.googleAdsBudgetCurrency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge status={c.googleAdsLinkStatus} />
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Card>
        <CardContent className="py-4 text-xs text-muted-foreground space-y-2">
          <div className="font-medium text-foreground">Quick links</div>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://ads.google.com/aw/accounts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Open Google Ads MCC →
            </a>
            <span>•</span>
            <span>
              <Sparkles className="inline h-3 w-3 mr-1" />
              AI ad recommendations available per-customer once a CID is linked
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
