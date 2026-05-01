import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Search, ExternalLink } from "lucide-react";

export const metadata = { title: "Google Search Console — Admin" };

export default async function GscOverviewPage() {
  await requireAdmin();

  const customers = await db.customer.findMany({
    where: { deletedAt: null },
    orderBy: [{ status: "asc" }, { businessName: "asc" }],
    select: {
      id: true,
      businessName: true,
      contactName: true,
      websiteUrl: true,
      localSeoEnabled: true,
      status: true,
    },
  });

  const withSite = customers.filter((c) => c.websiteUrl && c.websiteUrl.trim() !== "").length;
  const total = customers.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Google Search Console</h1>
          <p className="text-sm text-muted-foreground">
            Verify each contractor&rsquo;s domain in GSC and track organic search performance.
            Click a customer to manage their property.
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <strong className="text-foreground tabular-nums">{withSite}</strong> of{" "}
          <strong className="text-foreground tabular-nums">{total}</strong> customers have a
          website URL set
        </div>
      </div>

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
                  href={`/admin/customers/${c.id}/google-search-console`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="hidden sm:flex shrink-0 h-9 w-9 items-center justify-center rounded-md bg-[#4285F4]/10 text-[#4285F4]">
                    <Search className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[2fr_2fr_1fr_auto] gap-3 items-center">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{c.businessName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {c.contactName}
                      </div>
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
                          {c.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">No website set</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.localSeoEnabled ? (
                        <span className="text-foreground">SEO package on</span>
                      ) : (
                        <span>No SEO package</span>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Card>
        <CardContent className="py-4 text-xs text-muted-foreground space-y-2">
          <div className="font-medium text-foreground">GSC setup checklist (per contractor)</div>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Add the contractor&rsquo;s domain as a Domain property (covers http/https/www/non-www)</li>
            <li>Verify via DNS TXT record at GoDaddy / Cloudflare / their registrar</li>
            <li>Submit XML sitemap (typically <span className="font-mono">/sitemap.xml</span>)</li>
            <li>Wait 48-72h for the first impressions/clicks to appear</li>
            <li>Monitor Coverage report for crawl errors, especially on service-area pages</li>
            <li>Track ranking for the top 10 commercial keywords (driveway near me, roofing &lt;city&gt;, etc.)</li>
            <li>Connect GSC to GA4 so search query data appears in analytics</li>
          </ul>
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline pt-1"
          >
            Open Google Search Console <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
