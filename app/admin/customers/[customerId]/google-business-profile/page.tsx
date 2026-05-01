import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerById } from "@/server/services/customers";
import { requireAdmin } from "@/lib/auth-guard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/status-badge";
import { updateCustomerInlineAction } from "@/server/actions/customers";
import { ArrowLeft, ExternalLink, MapPin } from "lucide-react";

export const metadata = { title: "Google Business Profile — Admin" };

export default async function GbpSetupPage({
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
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Google Business Profile</h1>
          <StatusBadge status={customer.gbpEnabled ? "ACTIVE" : "INACTIVE"} />
        </div>
        <p className="text-sm text-muted-foreground">
          Manage the contractor&rsquo;s GBP listing — categories, services, photos, posts, Q&amp;A.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Listing details
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Paste the public Google Maps URL of the contractor&rsquo;s listing so the team can
            jump straight to it. Real GBP API integration ships later — for now we track the
            URL and the on/off status.
          </p>
        </CardHeader>
        <CardContent>
          <form action={updateCustomerInlineAction} className="space-y-4">
            <input type="hidden" name="id" value={customer.id} />
            <div>
              <Label htmlFor="websiteUrl">Public website (linked from GBP)</Label>
              <Input
                id="websiteUrl"
                name="websiteUrl"
                defaultValue={customer.websiteUrl ?? ""}
                placeholder="https://atlasconcrete.example"
              />
            </div>
            <div>
              <Label htmlFor="industry">GBP primary category (free text for now)</Label>
              <Input
                id="industry"
                name="industry"
                defaultValue={customer.industry ?? ""}
                placeholder="Concrete contractor, Roofing contractor, HVAC, Landscaping..."
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Use the exact Google category name. The most specific match always beats a
                generic &ldquo;Contractor&rdquo;.
              </p>
            </div>
            <div>
              <Label htmlFor="notes">Internal GBP notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={4}
                defaultValue={customer.notes ?? ""}
                placeholder="Place ID, owner email, verification status, posting cadence..."
              />
            </div>
            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Setup checklist</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
            <li>Claim or verify the listing in Google Business Profile manager.</li>
            <li>Set primary category to the most specific match (e.g. &ldquo;Concrete contractor&rdquo;, not &ldquo;General contractor&rdquo;).</li>
            <li>Add 2&ndash;3 relevant secondary categories.</li>
            <li>Define service areas to match the contractor&rsquo;s scope.</li>
            <li>List services using the same names as the portal&rsquo;s service list.</li>
            <li>Set the phone field to the assigned <strong>tracking number</strong>, never the contractor&rsquo;s real phone.</li>
            <li>Upload at least 10 photos: crew, trucks, before/after, completed projects.</li>
            <li>Seed 5 Q&amp;A entries with admin-provided answers.</li>
            <li>Schedule a weekly Google Post for the first 8 weeks.</li>
            <li>Set up review-request automation post-job.</li>
          </ol>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <a
          href="https://business.google.com/locations"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline" })}
        >
          Open GBP manager <ExternalLink className="h-3.5 w-3.5 ml-1" />
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
