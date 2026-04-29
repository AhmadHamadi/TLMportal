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
import {
  createCustomerAction,
  updateCustomerAction,
  type ActionResult,
} from "@/server/actions/customers";

type Customer = {
  id?: string;
  businessName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  forwardingPhone?: string;
  websiteUrl?: string | null;
  landingPageUrl?: string | null;
  googleAdsCustomerId?: string | null;
  setupFee?: string;
  monthlyRetainer?: string;
  appointmentFee?: string;
  monthlyAdBudget?: string;
  minProjectSize?: string | null;
  disputeWindowHours?: number;
  status?: "ACTIVE" | "PAUSED" | "WINTER_MODE" | "CANCELLED";
  notes?: string | null;
};

export function CustomerForm({ customer }: { customer?: Customer }) {
  const editing = Boolean(customer?.id);
  const action = editing ? updateCustomerAction : createCustomerAction;
  const [state, formAction, pending] = useActionState<ActionResult | undefined, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-6 max-w-3xl">
      {customer?.id ? <input type="hidden" name="id" value={customer.id} /> : null}

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Business</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="businessName">Business name</Label>
            <Input id="businessName" name="businessName" defaultValue={customer?.businessName} required />
          </div>
          <div>
            <Label htmlFor="contactName">Contact person</Label>
            <Input id="contactName" name="contactName" defaultValue={customer?.contactName} required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={customer?.email} required />
          </div>
          <div>
            <Label htmlFor="phone">Contact phone</Label>
            <Input id="phone" name="phone" defaultValue={customer?.phone} required placeholder="+14165550100" />
          </div>
          <div>
            <Label htmlFor="forwardingPhone">Forwarding phone</Label>
            <Input
              id="forwardingPhone"
              name="forwardingPhone"
              defaultValue={customer?.forwardingPhone}
              required
              placeholder="+14165550100"
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={customer?.status ?? "ACTIVE"}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="WINTER_MODE">Winter mode</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Web</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="websiteUrl">Website URL</Label>
            <Input id="websiteUrl" name="websiteUrl" defaultValue={customer?.websiteUrl ?? ""} />
          </div>
          <div>
            <Label htmlFor="landingPageUrl">Landing page URL</Label>
            <Input
              id="landingPageUrl"
              name="landingPageUrl"
              defaultValue={customer?.landingPageUrl ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="googleAdsCustomerId">Google Ads customer ID</Label>
            <Input
              id="googleAdsCustomerId"
              name="googleAdsCustomerId"
              defaultValue={customer?.googleAdsCustomerId ?? ""}
              placeholder="123-456-7890"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Billing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="setupFee">Setup fee</Label>
            <Input
              id="setupFee"
              name="setupFee"
              type="number"
              step="0.01"
              defaultValue={customer?.setupFee ?? "0"}
            />
          </div>
          <div>
            <Label htmlFor="monthlyRetainer">Monthly retainer</Label>
            <Input
              id="monthlyRetainer"
              name="monthlyRetainer"
              type="number"
              step="0.01"
              defaultValue={customer?.monthlyRetainer ?? "0"}
            />
          </div>
          <div>
            <Label htmlFor="appointmentFee">Appointment fee</Label>
            <Input
              id="appointmentFee"
              name="appointmentFee"
              type="number"
              step="0.01"
              defaultValue={customer?.appointmentFee ?? "0"}
            />
          </div>
          <div>
            <Label htmlFor="monthlyAdBudget">Monthly ad budget</Label>
            <Input
              id="monthlyAdBudget"
              name="monthlyAdBudget"
              type="number"
              step="0.01"
              defaultValue={customer?.monthlyAdBudget ?? "0"}
            />
          </div>
          <div>
            <Label htmlFor="minProjectSize">Minimum project size</Label>
            <Input
              id="minProjectSize"
              name="minProjectSize"
              type="number"
              step="0.01"
              defaultValue={customer?.minProjectSize ?? ""}
              placeholder="optional"
            />
          </div>
          <div>
            <Label htmlFor="disputeWindowHours">Dispute window (hours)</Label>
            <Input
              id="disputeWindowHours"
              name="disputeWindowHours"
              type="number"
              min={1}
              max={168}
              defaultValue={customer?.disputeWindowHours ?? 48}
            />
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={customer?.notes ?? ""} rows={3} />
      </section>

      {state && state.ok === false ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : editing ? "Save changes" : "Create customer"}
        </Button>
      </div>
    </form>
  );
}
