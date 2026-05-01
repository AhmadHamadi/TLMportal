import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { getCustomerById } from "@/server/services/customers";
import { requireAdmin } from "@/lib/auth-guard";
import { formatMoney } from "@/lib/money";
import { formatNational } from "@/lib/phone";
import {
  addServiceAction,
  toggleServiceAction,
  deleteServiceAction,
  addServiceAreaAction,
  toggleServiceAreaAction,
  deleteServiceAreaAction,
  deleteCustomerAction,
} from "@/server/actions/customers";
import { InviteUserForm } from "@/components/customers/invite-user-form";
import { ProvisionTrackingNumberForm } from "@/components/customers/provision-tracking-number-form";
import { releaseTrackingNumberAction } from "@/server/actions/tracking-numbers";
import { StartSubscriptionButton } from "@/components/billing/stripe-customer-actions";
import { ContractsTab } from "@/components/contracts/contracts-tab";
import { OnboardingTab } from "@/components/onboarding/onboarding-tab";
import { db } from "@/lib/db";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const ctx = await requireAdmin();
  const customer = await getCustomerById(ctx, customerId);
  if (!customer) notFound();
  const [subscription, contracts, onboardingItems] = await Promise.all([
    db.stripeSubscription.findUnique({ where: { customerId: customer.id } }),
    db.contract.findMany({
      where: { customerId: customer.id },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    db.onboardingItem.findMany({
      where: { customerId: customer.id },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{customer.businessName}</h1>
            <StatusBadge status={customer.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {customer.contactName} - {customer.email} - {formatNational(customer.phone)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/customers/${customer.id}/twilio`}
            className={buttonVariants({ size: "sm" })}
          >
            Twilio setup
          </Link>
          <Link
            href={`/admin/customers/${customer.id}/google-ads`}
            className={buttonVariants({ size: "sm" })}
          >
            Google Ads setup
          </Link>
          <Link
            href={`/admin/onboarding/${customer.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Onboarding
          </Link>
          <Link
            href={`/admin/customers/${customer.id}/ad-recommendations`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            AI ad recos
          </Link>
          <Link
            href={`/admin/reports/${customer.id}/${new Date().toISOString().slice(0, 7)}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Monthly report
          </Link>
          <Link
            href={`/admin/customers/${customer.id}/contract/msa-v1`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Generate MSA
          </Link>
          <Link
            href={`/admin/customers/${customer.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Edit
          </Link>
          <form action={deleteCustomerAction}>
            <input type="hidden" name="id" value={customer.id} />
            <Button type="submit" variant="destructive" size="sm">
              Archive
            </Button>
          </form>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="areas">Service areas</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="numbers">Tracking + SMS</TabsTrigger>
        </TabsList>

        <TabsContent value="onboarding">
          <OnboardingTab customerId={customer.id} items={onboardingItems} />
        </TabsContent>

        <TabsContent value="contracts">
          <ContractsTab customerId={customer.id} contracts={contracts} />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Setup fee</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatMoney(customer.setupFee)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Monthly retainer</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatMoney(customer.monthlyRetainer)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Appointment fee</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">
                {customer.leadEngineEnabled ? formatMoney(customer.appointmentFee) : "Not used"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">SEO/GBP retainer</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatMoney(customer.seoGbpMonthlyRetainer)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Monthly ad budget</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">
                {customer.googleAdsBudgetCurrency} {formatMoney(customer.monthlyAdBudget)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Min project size</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">
                {customer.minProjectSize ? formatMoney(customer.minProjectSize) : "-"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Internal review window</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{customer.disputeWindowHours}h</CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Active packages</CardTitle></CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {[
                { enabled: customer.leadEngineEnabled, label: "Lead Engine", detail: "Booked estimate workflow + tracking" },
                { enabled: customer.googleAdsEnabled, label: "Google Ads", detail: "MCC access, spend, conversions" },
                { enabled: customer.websiteEnabled, label: "Website", detail: "Website or landing page work" },
                { enabled: customer.localSeoEnabled, label: "Local SEO", detail: "$750/month flat retainer" },
                { enabled: customer.gbpEnabled, label: "GBP", detail: "Profile, posts, reviews, services" },
              ].map((pkg) => (
                <div key={pkg.label} className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{pkg.label}</span>
                    <StatusBadge status={pkg.enabled ? "ACTIVE" : "INACTIVE"} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{pkg.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          {customer.notes ? (
            <Card>
              <CardHeader><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
              <CardContent className="text-sm whitespace-pre-wrap">{customer.notes}</CardContent>
            </Card>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Stripe</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {subscription ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Status:</span>
                      <StatusBadge status={subscription.status.toUpperCase()} />
                    </div>
                    <div className="text-xs text-muted-foreground font-mono break-all">
                      {subscription.stripeSubscriptionId}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground">
                      No Stripe subscription yet. Set the monthly retainer first, then start one.
                    </p>
                    <StartSubscriptionButton customerId={customer.id} />
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Google Ads link</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Status:</span>
                  <StatusBadge status={customer.googleAdsLinkStatus} />
                </div>
                <div className="text-xs text-muted-foreground">
                  CID: <span className="font-mono">{customer.googleAdsCustomerId ?? "-"}</span>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  Real OAuth/MCC link request lands in Phase 9b. For now, set the CID and link
                  status manually in Edit.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Twilio Messaging Service</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="text-xs text-muted-foreground">
                  MS SID:{" "}
                  <span className="font-mono">{customer.twilioMessagingServiceSid ?? "(uses agency default)"}</span>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  Per-customer A2P 10DLC isolation: each contractor should have their own Brand
                  + Campaign → Messaging Service. Set the SID in Edit once provisioned.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Industry / niche</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="font-medium">{customer.industry ?? "-"}</div>
                <p className="text-xs text-muted-foreground">
                  Used in onboarding prompts (landing page rebuild brief, ad campaign structure).
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-3">
          <form action={addServiceAction} className="flex gap-2 max-w-md">
            <input type="hidden" name="customerId" value={customer.id} />
            <input
              type="text"
              name="name"
              placeholder="e.g. Concrete driveways"
              className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm"
              required
            />
            <Button type="submit" size="sm">Add</Button>
          </form>
          <ul className="rounded-md border divide-y bg-card">
            {customer.services.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className={s.isActive ? "" : "text-muted-foreground line-through"}>
                    {s.name}
                  </span>
                  {!s.isActive ? <StatusBadge status="INACTIVE" /> : null}
                </div>
                <div className="flex gap-2">
                  <form action={toggleServiceAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="customerId" value={customer.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      {s.isActive ? "Disable" : "Enable"}
                    </Button>
                  </form>
                  <form action={deleteServiceAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="customerId" value={customer.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Remove
                    </Button>
                  </form>
                </div>
              </li>
            ))}
            {customer.services.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground">No services yet.</li>
            ) : null}
          </ul>
        </TabsContent>

        <TabsContent value="areas" className="space-y-3">
          <form action={addServiceAreaAction} className="flex flex-wrap gap-2 max-w-2xl">
            <input type="hidden" name="customerId" value={customer.id} />
            <input
              type="text"
              name="city"
              placeholder="City"
              className="flex-1 min-w-[140px] rounded-md border bg-background px-3 py-1.5 text-sm"
              required
            />
            <input
              type="text"
              name="neighbourhood"
              placeholder="Neighbourhood (optional)"
              className="flex-1 min-w-[140px] rounded-md border bg-background px-3 py-1.5 text-sm"
            />
            <input
              type="text"
              name="province"
              defaultValue="ON"
              className="w-16 rounded-md border bg-background px-3 py-1.5 text-sm"
            />
            <Button type="submit" size="sm">Add</Button>
          </form>
          <ul className="rounded-md border divide-y bg-card">
            {customer.serviceAreas.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className={a.isActive ? "" : "text-muted-foreground line-through"}>
                    {[a.city, a.neighbourhood].filter(Boolean).join(" - ")}, {a.province}
                  </span>
                  {!a.isActive ? <StatusBadge status="INACTIVE" /> : null}
                </div>
                <div className="flex gap-2">
                  <form action={toggleServiceAreaAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="customerId" value={customer.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      {a.isActive ? "Disable" : "Enable"}
                    </Button>
                  </form>
                  <form action={deleteServiceAreaAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="customerId" value={customer.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Remove
                    </Button>
                  </form>
                </div>
              </li>
            ))}
            {customer.serviceAreas.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground">No service areas yet.</li>
            ) : null}
          </ul>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <ul className="rounded-md border divide-y bg-card">
            {customer.users.map((u) => (
              <li key={u.id} className="flex items-center justify-between px-4 py-2">
                <div>
                  <div className="font-medium text-sm">{u.user.name ?? u.user.email}</div>
                  <div className="text-xs text-muted-foreground">{u.user.email}</div>
                </div>
                <StatusBadge status={u.role} />
              </li>
            ))}
            {customer.users.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground">No users linked.</li>
            ) : null}
          </ul>
          <Separator />
          <h3 className="text-sm font-medium text-muted-foreground">Invite a contractor user</h3>
          <InviteUserForm customerId={customer.id} />
        </TabsContent>

        <TabsContent value="numbers" className="space-y-4">
          <ul className="rounded-md border divide-y bg-card">
            {customer.trackingNumbers.map((tn) => (
              <li key={tn.id} className="flex items-center justify-between px-4 py-2">
                <div>
                  <div className="font-medium text-sm">{formatNational(tn.twilioPhoneNumber)}</div>
                  <div className="text-xs text-muted-foreground">
                    forwards to {formatNational(tn.forwardingPhoneNumber)}
                    {tn.label ? ` - ${tn.label}` : ""}
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
            ))}
            {customer.trackingNumbers.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground">
                No tracking numbers assigned yet.
              </li>
            ) : null}
          </ul>
          <Separator />
          <h3 className="text-sm font-medium text-muted-foreground">Provision a tracking number</h3>
          <ProvisionTrackingNumberForm
            customerId={customer.id}
            defaultForwardingPhoneNumber={customer.forwardingPhone}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
