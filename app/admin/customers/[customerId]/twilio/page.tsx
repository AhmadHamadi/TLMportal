import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerById } from "@/server/services/customers";
import { requireAdmin } from "@/lib/auth-guard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProvisionTrackingNumberForm } from "@/components/customers/provision-tracking-number-form";
import { releaseTrackingNumberAction } from "@/server/actions/tracking-numbers";
import { updateCustomerInlineAction } from "@/server/actions/customers";
import { formatNational } from "@/lib/phone";
import { ArrowLeft, Phone } from "lucide-react";

export const metadata = { title: "Twilio setup — Admin" };

export default async function TwilioSetupPage({
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href={`/admin/customers/${customer.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to {customer.businessName}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Twilio setup
          </h1>
          <p className="text-sm text-muted-foreground">
            Tracking numbers, call forwarding, and per-customer SMS settings.
          </p>
        </div>
      </div>

      {/* TRACKING NUMBERS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            Tracking numbers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="rounded-md border bg-card divide-y">
            {customer.trackingNumbers.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground">
                No tracking numbers yet. Provision one below.
              </li>
            ) : (
              customer.trackingNumbers.map((tn) => (
                <li key={tn.id} className="flex items-center justify-between gap-2 px-4 py-3">
                  <div>
                    <div className="font-medium text-sm">{formatNational(tn.twilioPhoneNumber)}</div>
                    <div className="text-xs text-muted-foreground">
                      forwards to {formatNational(tn.forwardingPhoneNumber)}
                      {tn.label ? ` · ${tn.label}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={tn.status} />
                    {tn.status === "ACTIVE" ? (
                      <form action={releaseTrackingNumberAction}>
                        <input type="hidden" name="id" value={tn.id} />
                        <input type="hidden" name="customerId" value={customer.id} />
                        <Button type="submit" variant="ghost" size="sm">Release</Button>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))
            )}
          </ul>

          <div>
            <h3 className="text-sm font-medium mb-2">Provision a new tracking number</h3>
            <ProvisionTrackingNumberForm
              customerId={customer.id}
              defaultForwardingPhoneNumber={customer.forwardingPhone}
            />
          </div>
        </CardContent>
      </Card>

      {/* FORWARDING */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Default forwarding number</CardTitle>
          <p className="text-xs text-muted-foreground">
            The contractor&rsquo;s real phone. Inbound calls to any tracking number above
            forward here unless that tracking number has its own override.
          </p>
        </CardHeader>
        <CardContent>
          <form action={updateCustomerInlineAction} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
            <input type="hidden" name="id" value={customer.id} />
            <div>
              <Label htmlFor="forwardingPhone">Forwarding phone</Label>
              <Input
                id="forwardingPhone"
                name="forwardingPhone"
                defaultValue={customer.forwardingPhone}
                placeholder="+14165550100"
                required
              />
            </div>
            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>

      {/* MSSID */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">A2P 10DLC Messaging Service (optional)</CardTitle>
          <p className="text-xs text-muted-foreground">
            Per-customer Messaging Service SID. Leaves outbound SMS using the agency default
            when blank. Required when the contractor has their own A2P 10DLC Brand + Campaign
            registered for SMS deliverability.
          </p>
        </CardHeader>
        <CardContent>
          <form action={updateCustomerInlineAction} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
            <input type="hidden" name="id" value={customer.id} />
            <div>
              <Label htmlFor="twilioMessagingServiceSid">Messaging Service SID</Label>
              <Input
                id="twilioMessagingServiceSid"
                name="twilioMessagingServiceSid"
                defaultValue={customer.twilioMessagingServiceSid ?? ""}
                placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>
            <Button type="submit" variant="outline">Save</Button>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-md border bg-muted/40 p-4 text-xs text-muted-foreground space-y-2">
        <p>
          <strong>Webhook URLs</strong> on each Twilio number should be set to:
        </p>
        <ul className="list-disc list-inside font-mono">
          <li>Voice: <span>https://portal.tradeleadsmarketing.com/api/webhooks/twilio/voice</span></li>
          <li>SMS: <span>https://portal.tradeleadsmarketing.com/api/webhooks/twilio/sms</span></li>
        </ul>
        <p>The portal sets these automatically when you provision a number above.</p>
      </div>

      <div>
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
