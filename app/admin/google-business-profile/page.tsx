import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/shared/status-badge";
import { ChevronRight, AlertCircle, MapPin, ExternalLink } from "lucide-react";

export const metadata = { title: "Google Business Profile — Admin" };

export default async function GbpOverviewPage() {
  await requireAdmin();

  const customers = await db.customer.findMany({
    where: { deletedAt: null },
    orderBy: [{ status: "asc" }, { businessName: "asc" }],
    select: {
      id: true,
      businessName: true,
      contactName: true,
      industry: true,
      gbpEnabled: true,
      localSeoEnabled: true,
      websiteUrl: true,
      status: true,
    },
  });

  const enabled = customers.filter((c) => c.gbpEnabled).length;
  const total = customers.length;
  const billingCustomers = customers.filter((c) => c.gbpEnabled || c.localSeoEnabled);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Google Business Profile</h1>
          <p className="text-sm text-muted-foreground">
            Track GBP setup status per contractor. Click a customer to manage their listing
            categories, services, photos, and Q&amp;A.
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div>
            <strong className="text-foreground tabular-nums">{enabled}</strong> of{" "}
            <strong className="text-foreground tabular-nums">{total}</strong> customers have GBP
            management on
          </div>
        </div>
      </div>

      {billingCustomers.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No customers have <strong>Google Business Profile</strong> enabled yet. Turn it on
            in a customer&rsquo;s Edit page (<em>Packages</em> section). It&rsquo;s usually
            bundled with Local SEO under the $750/mo retainer.
          </AlertDescription>
        </Alert>
      ) : null}

      {customers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No customers yet.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border bg-card overflow-hidden">
          <ul className="divide-y">
            {customers.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/customers/${c.id}/google-business-profile`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="hidden sm:flex shrink-0 h-9 w-9 items-center justify-center rounded-md bg-[#34A853]/10 text-[#1E8E3E]">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[2fr_1.5fr_1.2fr_1fr] gap-3 items-center">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{c.businessName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {c.industry ?? c.contactName}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.gbpEnabled ? (
                        <span className="text-foreground">GBP package on</span>
                      ) : (
                        <span>No GBP package</span>
                      )}
                      {c.localSeoEnabled ? (
                        <span className="block text-[10px] mt-0.5">+ Local SEO</span>
                      ) : null}
                    </div>
                    <div className="text-xs">
                      {c.websiteUrl ? (
                        <a
                          href={c.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:underline truncate inline-flex items-center gap-1"
                        >
                          Site <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">No site set</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge status={c.gbpEnabled ? "ACTIVE" : "INACTIVE"} />
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
          <div className="font-medium text-foreground">GBP setup checklist (per contractor)</div>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Claim or verify the listing in Google Business Profile manager</li>
            <li>Set primary category to the most specific one (e.g. &ldquo;Concrete contractor&rdquo;)</li>
            <li>Add 2-3 secondary categories (e.g. &ldquo;Driveway contractor&rdquo;)</li>
            <li>Define service areas matching the contractor&rsquo;s scope</li>
            <li>List services with names matching the customer&rsquo;s service list in the portal</li>
            <li>Upload at least 10 photos (crew, before/after, trucks, completed work)</li>
            <li>Set the phone field to the assigned tracking number, NOT the contractor&rsquo;s real number</li>
            <li>Seed 5 Q&amp;A entries with admin-provided answers</li>
            <li>Schedule weekly Google Posts for the first 8 weeks</li>
          </ul>
          <a
            href="https://business.google.com/locations"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline pt-1"
          >
            Open Google Business Profile manager <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
