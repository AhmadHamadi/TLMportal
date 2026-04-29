"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AUTOMATION_TRIGGERS, AUTOMATION_ACTION_TYPES } from "@/schemas/automation";
import { createRuleAction, type ActionResult } from "@/server/actions/automation";

export function CreateRuleForm({
  customers,
}: {
  customers: { id: string; businessName: string }[];
}) {
  const [state, formAction, pending] = useActionState<ActionResult | undefined, FormData>(
    createRuleAction,
    undefined,
  );
  return (
    <form action={formAction} className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <Label htmlFor="customerId">Customer</Label>
        <Select name="customerId" required>
          <SelectTrigger><SelectValue placeholder="Customer" /></SelectTrigger>
          <SelectContent>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.businessName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" placeholder="Welcome SMS to new leads" required />
      </div>
      <div>
        <Label htmlFor="trigger">Trigger</Label>
        <Select name="trigger" defaultValue="LEAD_CREATED">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {AUTOMATION_TRIGGERS.map((t) => (
              <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="actionType">Action</Label>
        <Select name="actionType" defaultValue="SEND_SMS">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {AUTOMATION_ACTION_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="smsTemplate">SMS template / message</Label>
        <Textarea
          id="smsTemplate"
          name="smsTemplate"
          rows={3}
          placeholder="Hi {{firstName}}, thanks for requesting a quote for {{service}}..."
        />
      </div>
      {state?.ok === false ? (
        <div className="md:col-span-2">
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        </div>
      ) : null}
      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating..." : "Create rule"}
        </Button>
      </div>
    </form>
  );
}
