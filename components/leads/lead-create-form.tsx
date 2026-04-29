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
import { LEAD_SOURCE_VALUES } from "@/schemas/lead";
import { createLeadAction, type ActionResult } from "@/server/actions/leads";

export function LeadCreateForm({
  customers,
}: {
  customers: { id: string; businessName: string }[];
}) {
  const [state, formAction, pending] = useActionState<ActionResult | undefined, FormData>(
    createLeadAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-6 max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customerId">Customer</Label>
          <Select name="customerId" required>
            <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
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
          <Label htmlFor="source">Source</Label>
          <Select name="source" defaultValue="MANUAL_ADMIN_ENTRY">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LEAD_SOURCE_VALUES.map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" name="firstName" />
        </div>
        <div>
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" name="lastName" />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" placeholder="+14165550100" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" />
        </div>
        <div>
          <Label htmlFor="neighbourhood">Neighbourhood</Label>
          <Input id="neighbourhood" name="neighbourhood" />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" />
        </div>
        <div>
          <Label htmlFor="serviceRequested">Service requested</Label>
          <Input id="serviceRequested" name="serviceRequested" />
        </div>
        <div>
          <Label htmlFor="estimatedProjectSize">Estimated project size ($)</Label>
          <Input id="estimatedProjectSize" name="estimatedProjectSize" type="number" step="0.01" />
        </div>
        <div>
          <Label htmlFor="preferredTime">Preferred time</Label>
          <Input id="preferredTime" name="preferredTime" placeholder="Saturday morning" />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="projectDetails">Project details</Label>
          <Textarea id="projectDetails" name="projectDetails" rows={3} />
        </div>
      </div>
      {state && state.ok === false ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create lead"}
      </Button>
    </form>
  );
}
