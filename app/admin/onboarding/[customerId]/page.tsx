import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { getCustomerById } from "@/server/services/customers";
import { requireAdmin } from "@/lib/auth-guard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { spawnChecklistAction } from "@/server/actions/onboarding";
import { ProvisionTrackingNumberForm } from "@/components/customers/provision-tracking-number-form";
import { InviteUserForm } from "@/components/customers/invite-user-form";
import { StartSubscriptionButton } from "@/components/billing/stripe-customer-actions";
import { cn } from "@/lib/utils";

export const metadata = { title: "Onboarding — Admin" };

export default async function OnboardingWizard({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const ctx = await requireAdmin();
  const customer = await getCustomerById(ctx, customerId);
  if (!customer) notFound();

  const [trackingCount, onboardingCount, contractsCount, subscription] = await Promise.all([
    db.trackingNumber.count({ where: { customerId, status: "ACTIVE" } }),
    db.onboardingItem.count({ where: { customerId } }),
    db.contract.count({ where: { customerId } }),
    db.stripeSubscription.findUnique({ where: { customerId } }),
  ]);

  const userCount = customer.users.length;
  const servicesCount = customer.services.length;
  const areasCount = customer.serviceAreas.length;

  const steps = [
    {
      id: "basics",
      title: "Customer record",
      done: true,
      hint: "Created. Edit details any time.",
      cta: { label: "Edit", href: `/admin/customers/${customer.id}/edit` },
    },
    {
      id: "services",
      title: "Services & areas",
      done: servicesCount > 0 && areasCount > 0,
      hint: `${servicesCount} services, ${areasCount} areas`,
      cta: { label: "Manage", href: `/admin/customers/${customer.id}` },
    },
    {
      id: "checklist",
      title: "Onboarding checklist",
      done: onboardingCount > 0,
      hint:
        onboardingCount === 0
          ? "Spawn the standard checklist with auto-filled prompts."
          : `${onboardingCount} items in progress`,
    },
    {
      id: "msa",
      title: "Master Service Agreement",
      done: contractsCount > 0,
      hint:
        contractsCount === 0
          ? "Generate the auto-filled MSA, print to PDF, send for signature."
          : `${contractsCount} contracts on file`,
      cta: {
        label: "Generate MSA",
        href: `/admin/customers/${customer.id}/contract/msa-v1`,
      },
    },
    {
      id: "tracking",
      title: "Tracking number",
      done: trackingCount > 0,
      hint:
        trackingCount === 0
          ? "Provision a Twilio number that forwards to the contractor."
          : `${trackingCount} active number(s)`,
    },
    {
      id: "user",
      title: "Contractor portal access",
      done: userCount > 0,
      hint:
        userCount === 0
          ? "Invite the contractor with a temporary password."
          : `${userCount} user(s) linked`,
    },
    {
      id: "stripe",
      title: "Billing (Stripe subscription)",
      done: Boolean(subscription),
      hint: subscription
        ? `Status: ${subscription.status}`
        : "Start the recurring monthly retainer subscription.",
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const percent = Math.round((completed / total) * 100);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
            Onboarding · {customer.businessName}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">
            Get this contractor live in under 30 minutes
          </h1>
        </div>
        <Link
          href={`/admin/customers/${customer.id}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Customer detail
        </Link>
      </div>

      <Card>
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">
                {completed} of {total} complete
              </div>
              <div className="text-xs text-muted-foreground">
                {percent}% done
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-[#F37021] transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={step.id}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  {step.done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle
                      className={cn(
                        "text-base font-semibold",
                        step.done && "text-muted-foreground",
                      )}
                    >
                      {String(i + 1).padStart(2, "0")} · {step.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{step.hint}</p>
                  </div>
                  {step.done ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                      Done
                    </Badge>
                  ) : null}
                  {!step.done && step.cta ? (
                    <Link
                      href={step.cta.href}
                      className={buttonVariants({ size: "sm" })}
                    >
                      {step.cta.label}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="pl-12 pt-0 pb-4">
                {step.id === "checklist" && !step.done ? (
                  <form action={spawnChecklistAction}>
                    <input type="hidden" name="customerId" value={customer.id} />
                    <Button type="submit" size="sm">Spawn default checklist</Button>
                  </form>
                ) : null}
                {step.id === "checklist" && step.done ? (
                  <Link
                    href={`/admin/customers/${customer.id}#onboarding`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Open checklist
                  </Link>
                ) : null}
                {step.id === "tracking" && !step.done ? (
                  <ProvisionTrackingNumberForm
                    customerId={customer.id}
                    defaultForwardingPhoneNumber={customer.forwardingPhone}
                  />
                ) : null}
                {step.id === "user" && !step.done ? (
                  <InviteUserForm customerId={customer.id} />
                ) : null}
                {step.id === "stripe" && !step.done ? (
                  <StartSubscriptionButton customerId={customer.id} />
                ) : null}
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
}
