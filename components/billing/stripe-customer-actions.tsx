"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startSubscriptionAction } from "@/server/actions/stripe";
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
