"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  provisionTrackingNumberAction,
  type ActionResult,
} from "@/server/actions/tracking-numbers";

export function ProvisionTrackingNumberForm({
  customerId,
  defaultForwardingPhoneNumber,
}: {
  customerId: string;
  defaultForwardingPhoneNumber: string;
}) {
  const [state, formAction, pending] = useActionState<ActionResult | undefined, FormData>(
    provisionTrackingNumberAction,
    undefined,
  );
  return (
    <form action={formAction} className="grid grid-cols-1 md:grid-cols-4 gap-2 max-w-3xl">
      <input type="hidden" name="customerId" value={customerId} />
      <div>
        <Label htmlFor="areaCode">Area code</Label>
        <Input id="areaCode" name="areaCode" placeholder="416" />
      </div>
      <div>
        <Label htmlFor="forwardingPhoneNumber">Forwarding phone</Label>
        <Input
          id="forwardingPhoneNumber"
          name="forwardingPhoneNumber"
          defaultValue={defaultForwardingPhoneNumber}
          required
        />
      </div>
      <div>
        <Label htmlFor="label">Label</Label>
        <Input id="label" name="label" placeholder="Main line" />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Provisioning..." : "Provision number"}
        </Button>
      </div>
      {state?.ok === false ? (
        <div className="md:col-span-4">
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        </div>
      ) : null}
      {state?.ok === true && state.simulated ? (
        <div className="md:col-span-4">
          <Alert>
            <AlertDescription>
              Simulated provisioning (Twilio not configured). A placeholder number was assigned.
            </AlertDescription>
          </Alert>
        </div>
      ) : null}
    </form>
  );
}
