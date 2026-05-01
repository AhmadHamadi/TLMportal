import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerById } from "@/server/services/customers";
import { requireAdmin } from "@/lib/auth-guard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateCustomerInlineAction } from "@/server/actions/customers";
import { ArrowLeft, ExternalLink, Search } from "lucide-react";

export const metadata = { title: "Google Search Console — Admin" };

export default async function GscSetupPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const ctx = await requireAdmin();
  const customer = await getCustomerById(ctx, customerId);
  if (!customer) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href={`/admin/customers/${customer.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {customer.businessName}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Google Search Console</h1>
        <p className="text-sm text-muted-foreground">
          Verify the contractor&rsquo;s domain and track organic search.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            Property details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateCustomerInlineAction} className="space-y-4">
            <input type="hidden" name="id" value={customer.id} />
            <div>
              <Label htmlFor="websiteUrl">Verified website URL</Label>
              <Input
                id="websiteUrl"
                name="websiteUrl"
                defaultValue={customer.websiteUrl ?? ""}
                placeholder="https://atlasconcrete.example"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Use the canonical https URL of the contractor&rsquo;s site. We track GSC against
                this address.
              </p>
            </div>
            <div>
              <Label htmlFor="notes">GSC notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={4}
                defaultValue={customer.notes ?? ""}
                placeholder="Verification method (DNS / file upload / GA), property type (Domain vs URL prefix), top keywords, sitemap URL..."
              />
            </div>
            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Setup steps</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
            <li>
              Open <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Search Console</a> as admin.
            </li>
            <li>Add the contractor&rsquo;s domain as a <strong>Domain property</strong> (covers all subdomains + http/https).</li>
            <li>Verify via DNS TXT record at the contractor&rsquo;s registrar (GoDaddy / Cloudflare / Namecheap).</li>
            <li>Submit the XML sitemap (typically <code>/sitemap.xml</code>).</li>
            <li>Connect to GA4 if not already, so query data appears in analytics.</li>
            <li>Wait 48&ndash;72h for first data; bookmark the Performance and Coverage reports.</li>
            <li>Set up keyword tracking for the contractor&rsquo;s top 10 commercial terms.</li>
          </ol>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <a
          href="https://search.google.com/search-console"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline" })}
        >
          Open Search Console <ExternalLink className="h-3.5 w-3.5 ml-1" />
        </a>
        <Link
          href={`/admin/customers/${customer.id}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Done — back to customer
        </Link>
      </div>
    </div>
  );
}
