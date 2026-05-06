"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  startSubscriptionAction,
  onboardCustomerAction,
} from "@/server/actions/stripe";
import { toast } from "sonner";

export function StartSubscriptionButton({ customerId }: { customerId: string }) {
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => {
        start(async () => {
          const r = await startSubscriptionAction(fd);
          if (r.ok) toast.success("Subscription started in Stripe");
          else toast.error(r.error);
        });
      }}
    >
      <input type="hidden" name="customerId" value={customerId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Starting..." : "Start Stripe subscription"}
      </Button>
    </form>
  );
}

// One-click onboarding: invoices the setup fee AND starts the monthly
// subscription. Admin reaches for this button after the contract is signed.
// Confirms before firing because the action is real-money and not reversible
// once the customer has paid the invoice.
export function OnboardCustomerButton({
  customerId,
  contractSigned,
}: {
  customerId: string;
  contractSigned: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => {
        if (
          !contractSigned &&
          !confirm(
            "No signed Master Onboarding Agreement on file for this customer. Onboard in Stripe anyway? This will invoice the setup fee and start recurring billing.",
          )
        ) {
          return;
        }
        start(async () => {
          const r = await onboardCustomerAction(fd);
          if (r.ok)
            toast.success(
              "Onboarded in Stripe — setup fee invoiced and subscription started.",
            );
          else toast.error(r.error);
        });
      }}
    >
      <input type="hidden" name="customerId" value={customerId} />
      <Button type="submit" disabled={pending} className="gap-2">
        {pending ? "Onboarding..." : "Onboard in Stripe (one click)"}
      </Button>
    </form>
  );
}
