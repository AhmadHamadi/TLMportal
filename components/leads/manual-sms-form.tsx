"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sendManualSmsAction, type ActionResult } from "@/server/actions/sms";

export function ManualSmsForm({ leadId }: { leadId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | undefined, FormData>(
    sendManualSmsAction,
    undefined,
  );
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="leadId" value={leadId} />
      <Label htmlFor="body">Send SMS to lead</Label>
      <Textarea id="body" name="body" rows={3} placeholder="Hi, this is..." required />
      {state?.ok === false ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state?.ok === true && state.simulated ? (
        <Alert>
          <AlertDescription>
            Simulated send (Twilio not configured yet). Logged for review.
          </AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" variant="outline" disabled={pending} className="w-full">
        {pending ? "Sending..." : "Send"}
      </Button>
    </form>
  );
}
