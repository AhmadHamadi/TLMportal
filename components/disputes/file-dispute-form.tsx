"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fileDisputeAction, type ActionResult } from "@/server/actions/disputes";
import { DISPUTE_REASONS } from "@/schemas/dispute";

export function FileDisputeForm({ appointmentId }: { appointmentId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | undefined, FormData>(
    fileDisputeAction,
    undefined,
  );
  return (
    <form action={formAction} className="grid grid-cols-1 md:grid-cols-3 gap-2">
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <Select name="reason" required>
        <SelectTrigger><SelectValue placeholder="Reason" /></SelectTrigger>
        <SelectContent>
          {DISPUTE_REASONS.map((r) => (
            <SelectItem key={r} value={r}>{r}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Textarea name="details" placeholder="Additional details (optional)" rows={1} />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Filing..." : "File dispute"}
      </Button>
      {state && state.ok === false ? (
        <div className="md:col-span-3">
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        </div>
      ) : null}
    </form>
  );
}
