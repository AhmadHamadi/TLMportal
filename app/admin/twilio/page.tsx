import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { isTwilioConfigured } from "@/lib/twilio";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatNational } from "@/lib/phone";
import { Phone, ChevronRight, AlertCircle } from "lucide-react";

export const metadata = { title: "Twilio — Admin" };

export default async function TwilioOverviewPage() {
  await requireAdmin();
  const twilioReady = isTwilioConfigured();

  const customers = await db.customer.findMany({
    where: { deletedAt: null },
    orderBy: [{ status: "asc" }, { businessName: "asc" }],
    select: {
      id: true,
      businessName: true,
      contactName: true,
      forwardingPhone: true,
      twilioMessagingServiceSid: true,
      status: true,
      trackingNumbers: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          twilioPhoneNumber: true,
          forwardingPhoneNumber: true,
          label: true,
        },
      },
      _count: {
        select: { callLogs: true, smsMessages: true },
      },
    },
  });

  const provisioned = customers.filter((c) => c.trackingNumbers.length > 0).length;
  const total = customers.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Twilio</h1>
          <p className="text-sm text-muted-foreground">
            Map each customer to a tracking number, forwarding number, and Messaging Service.
            Click a customer to manage their settings.
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div>
            <strong className="text-foreground tabular-nums">{provisioned}</strong> of{" "}
            <strong className="text-foreground tabular-nums">{total}</strong> customers have a
            tracking number
          </div>
        </div>
      </div>

      {!twilioReady ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Twilio account env vars are not configured (<code>TWILIO_ACCOUNT_SID</code>,{" "}
            <code>TWILIO_AUTH_TOKEN</code>). Number provisioning runs in <strong>simulated</strong>{" "}
            mode — it records placeholder numbers in the DB so you can see the workflow but
            doesn&rsquo;t buy real numbers. Set the env vars in Vercel to go live.
          </AlertDescription>
        </Alert>
      ) : null}

      {customers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No customers yet. Add one to start configuring Twilio.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border bg-card overflow-hidden">
          <ul className="divide-y">
            {customers.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/customers/${c.id}/twilio`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="hidden sm:flex shrink-0 h-9 w-9 items-center justify-center rounded-md bg-[#F37021]/10 text-[#F37021]">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[2fr_2fr_1.5fr_1fr] gap-3 items-center">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{c.businessName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {c.contactName}
                      </div>
                    </div>
                    <div className="text-xs">
                      {c.trackingNumbers.length === 0 ? (
                        <span className="text-muted-foreground">No tracking number</span>
                      ) : (
                        <div className="space-y-0.5">
                          {c.trackingNumbers.slice(0, 2).map((tn) => (
                            <div key={tn.id} className="font-mono">
                              {formatNational(tn.twilioPhoneNumber)}
                              {tn.label ? (
                                <span className="text-muted-foreground"> · {tn.label}</span>
                              ) : null}
                            </div>
                          ))}
                          {c.trackingNumbers.length > 2 ? (
                            <div className="text-muted-foreground">
                              +{c.trackingNumbers.length - 2} more
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      <span className="text-foreground/70">Forwards →</span>{" "}
                      <span className="font-mono">{formatNational(c.forwardingPhone)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge status={c.status} />
                        {c.twilioMessagingServiceSid ? (
                          <span className="text-[10px] text-muted-foreground">MS configured</span>
                        ) : null}
                      </div>
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
          <div className="font-medium text-foreground">Webhook URLs (set per number in Twilio)</div>
          <ul className="font-mono space-y-0.5">
            <li>Voice: https://portal.tradeleadsmarketing.com/api/webhooks/twilio/voice</li>
            <li>SMS: https://portal.tradeleadsmarketing.com/api/webhooks/twilio/sms</li>
          </ul>
          <p>
            The portal sets these automatically when you provision a number from a customer&rsquo;s
            Twilio setup page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
