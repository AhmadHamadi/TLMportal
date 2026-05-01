import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerById } from "@/server/services/customers";
import { requireAdmin } from "@/lib/auth-guard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { updateCustomerInlineAction } from "@/server/actions/customers";
import { ArrowLeft, Sparkles, ExternalLink } from "lucide-react";

export const metadata = { title: "Google Ads setup — Admin" };

export default async function GoogleAdsSetupPage({
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
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Google Ads setup</h1>
        <p className="text-sm text-muted-foreground">
          Connect the contractor&rsquo;s Google Ads account to your manager (MCC).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer ID + link status</CardTitle>
          <p className="text-xs text-muted-foreground">
            10-digit Google Ads Customer ID from the contractor&rsquo;s account.
          </p>
        </CardHeader>
        <CardContent>
          <form action={updateCustomerInlineAction} className="space-y-4">
            <input type="hidden" name="id" value={customer.id} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="googleAdsCustomerId">Google Ads Customer ID</Label>
                <Input
                  id="googleAdsCustomerId"
                  name="googleAdsCustomerId"
                  defaultValue={customer.googleAdsCustomerId ?? ""}
                  placeholder="123-456-7890"
                />
              </div>
              <div>
                <Label htmlFor="googleAdsBudgetCurrency">Currency</Label>
                <Select
                  name="googleAdsBudgetCurrency"
                  defaultValue={customer.googleAdsBudgetCurrency ?? "CAD"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="monthlyAdBudget">Monthly ad budget</Label>
                <Input
                  id="monthlyAdBudget"
                  name="monthlyAdBudget"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={customer.monthlyAdBudget?.toString() ?? "0"}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit">Save</Button>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs text-muted-foreground">Link status:</span>
              <StatusBadge status={customer.googleAdsLinkStatus} />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to link the account</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              Open <a href="https://ads.google.com/aw/accounts" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Ads → Tools → Sub-accounts</a> in your manager (MCC) account.
            </li>
            <li>Click <strong>+ Add</strong> → choose <strong>Link existing account</strong>.</li>
            <li>Paste the contractor&rsquo;s 10-digit Customer ID from above. Send invite.</li>
            <li>Contractor receives an email invitation; they click <strong>Accept</strong> in their Google Ads account.</li>
            <li>Status flips to <strong>LINKED</strong>. You can now run campaigns under their account.</li>
          </ol>
          <div className="rounded-md border bg-muted/40 p-3 text-xs">
            <strong>Tip:</strong> Spend is paid by the contractor directly to Google. The agency
            does not pass-through ad spend. Conversion tracking and call extensions wire to the
            tracking number on the Twilio setup page.
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/customers/${customer.id}/ad-recommendations`}
          className={buttonVariants({ variant: "outline" })}
        >
          <Sparkles className="h-4 w-4 mr-1" />
          AI ad recommendations
        </Link>
        <a
          href="https://ads.google.com/aw/accounts"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline" })}
        >
          Open Google Ads <ExternalLink className="h-3.5 w-3.5 ml-1" />
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
