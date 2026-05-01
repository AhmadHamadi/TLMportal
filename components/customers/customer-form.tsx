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
  industry?: string | null;
  googleAdsCustomerId?: string | null;
  twilioMessagingServiceSid?: string | null;
  setupFee?: string;
  monthlyRetainer?: string;
  appointmentFee?: string;
  seoGbpMonthlyRetainer?: string;
  monthlyAdBudget?: string;
  googleAdsBudgetCurrency?: "CAD" | "USD";
  minProjectSize?: string | null;
  disputeWindowHours?: number;
  status?: "ACTIVE" | "PAUSED" | "WINTER_MODE" | "CANCELLED";
  notes?: string | null;
  leadEngineEnabled?: boolean;
  googleAdsEnabled?: boolean;
  websiteEnabled?: boolean;
  localSeoEnabled?: boolean;
  gbpEnabled?: boolean;
};

export function CustomerForm({ customer }: { customer?: Customer }) {
  const editing = Boolean(customer?.id);
  const action = editing ? updateCustomerAction : createCustomerAction;
  const [state, formAction, pending] = useActionState<ActionResult | undefined, FormData>(
    action,
    undefined,
  );

  // CREATE MODE — minimal 5-field form. Admin fills Twilio / Google Ads /
  // packages / fees details on dedicated setup pages after creation.
  if (!editing) {
    return (
      <form action={formAction} className="space-y-5 max-w-xl">
        <div className="space-y-1.5">
          <Label htmlFor="businessName">Business name</Label>
          <Input
            id="businessName"
            name="businessName"
            required
            placeholder="Atlas Concrete"
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="contact@atlasconcrete.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            name="phone"
            required
            placeholder="(416) 555-0100"
          />
          <p className="text-xs text-muted-foreground">
            Used as the contact phone and the default call-forwarding number.
            You can change forwarding later on the Twilio setup page.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="setupFee">Setup fee</Label>
            <Input
              id="setupFee"
              name="setupFee"
              type="number"
              step="0.01"
              min="0"
              defaultValue="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="monthlyRetainer">Monthly retainer</Label>
            <Input
              id="monthlyRetainer"
              name="monthlyRetainer"
              type="number"
              step="0.01"
              min="0"
              defaultValue="0"
            />
          </div>
        </div>

        {state && state.ok === false ? (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
          After creating, you&rsquo;ll go to the customer page to set up Google Ads, the Twilio
          tracking number, services, areas, contracts, and packages — one focused page each.
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create customer"}
          </Button>
        </div>
      </form>
    );
  }

  // EDIT MODE — full form with everything, for fine-tuning later.
  return (
    <form action={formAction} className="space-y-6 max-w-3xl">
      <input type="hidden" name="id" value={customer!.id} />

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Business</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="businessName">Business name</Label>
            <Input id="businessName" name="businessName" defaultValue={customer?.businessName} required />
          </div>
          <div>
            <Label htmlFor="contactName">Contact person</Label>
            <Input id="contactName" name="contactName" defaultValue={customer?.contactName} />
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
        <h3 className="text-sm font-medium text-muted-foreground">Web + niche</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="industry">Industry / niche</Label>
            <Input
              id="industry"
              name="industry"
              defaultValue={customer?.industry ?? ""}
              placeholder="Concrete contractor, Roofing, HVAC..."
            />
          </div>
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
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Packages</h3>
        <p className="text-xs text-muted-foreground">
          Connect Google Ads or provision a Twilio number on the dedicated setup pages from the
          customer detail view.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-start gap-2 rounded-md border bg-card p-3 text-sm">
            <input type="checkbox" name="packageLeadEngine" defaultChecked={customer?.leadEngineEnabled ?? true} className="mt-1" />
            <span>
              <span className="font-medium">Lead Engine</span>
              <span className="block text-xs text-muted-foreground">Tracking number, SMS, booked appointments.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 rounded-md border bg-card p-3 text-sm">
            <input type="checkbox" name="packageGoogleAds" defaultChecked={customer?.googleAdsEnabled ?? false} className="mt-1" />
            <span>
              <span className="font-medium">Google Ads management</span>
              <span className="block text-xs text-muted-foreground">MCC link, conversion tracking, spend.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 rounded-md border bg-card p-3 text-sm">
            <input type="checkbox" name="packageWebsite" defaultChecked={customer?.websiteEnabled ?? false} className="mt-1" />
            <span>
              <span className="font-medium">Website / landing page</span>
              <span className="block text-xs text-muted-foreground">New build or rebuild.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 rounded-md border bg-card p-3 text-sm">
            <input type="checkbox" name="packageSeo" defaultChecked={customer?.localSeoEnabled ?? false} className="mt-1" />
            <span>
              <span className="font-medium">Local SEO</span>
              <span className="block text-xs text-muted-foreground">$750/mo flat retainer.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 rounded-md border bg-card p-3 text-sm">
            <input type="checkbox" name="packageGbp" defaultChecked={customer?.gbpEnabled ?? false} className="mt-1" />
            <span>
              <span className="font-medium">Google Business Profile</span>
              <span className="block text-xs text-muted-foreground">Bundled with Local SEO retainer.</span>
            </span>
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Billing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="payPerAppointment">Booked appointment billing</Label>
            <Select
              name="payPerAppointment"
              defaultValue={Number(customer?.appointmentFee ?? "0") > 0 ? "yes" : "no"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Retainer + booked appointment fee</SelectItem>
                <SelectItem value="no">Retainer only / no appointment fee</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="setupFee">Setup fee</Label>
            <Input id="setupFee" name="setupFee" type="number" step="0.01" defaultValue={customer?.setupFee ?? "0"} />
          </div>
          <div>
            <Label htmlFor="monthlyRetainer">Monthly retainer</Label>
            <Input id="monthlyRetainer" name="monthlyRetainer" type="number" step="0.01" defaultValue={customer?.monthlyRetainer ?? "0"} />
          </div>
          <div>
            <Label htmlFor="appointmentFee">Appointment fee</Label>
            <Input id="appointmentFee" name="appointmentFee" type="number" step="0.01" defaultValue={customer?.appointmentFee ?? "0"} />
          </div>
          <div>
            <Label htmlFor="seoGbpMonthlyRetainer">SEO/GBP retainer</Label>
            <Input id="seoGbpMonthlyRetainer" name="seoGbpMonthlyRetainer" type="number" step="0.01" defaultValue={customer?.seoGbpMonthlyRetainer ?? "750"} />
          </div>
          <div>
            <Label htmlFor="monthlyAdBudget">Monthly ad budget</Label>
            <Input id="monthlyAdBudget" name="monthlyAdBudget" type="number" step="0.01" defaultValue={customer?.monthlyAdBudget ?? "0"} />
          </div>
          <div>
            <Label htmlFor="googleAdsBudgetCurrency">Ad budget currency</Label>
            <Select name="googleAdsBudgetCurrency" defaultValue={customer?.googleAdsBudgetCurrency ?? "CAD"}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CAD">CAD</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="minProjectSize">Minimum project size</Label>
            <Input id="minProjectSize" name="minProjectSize" type="number" step="0.01" defaultValue={customer?.minProjectSize ?? ""} placeholder="optional" />
          </div>
          <div>
            <Label htmlFor="disputeWindowHours">Internal review window (hours)</Label>
            <Input id="disputeWindowHours" name="disputeWindowHours" type="number" min={1} max={168} defaultValue={customer?.disputeWindowHours ?? 48} />
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
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
