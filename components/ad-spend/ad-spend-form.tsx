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
import { upsertAdSpendAction, type ActionResult } from "@/server/actions/ad-spend";

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function AdSpendForm({
  customers,
}: {
  customers: { id: string; businessName: string }[];
}) {
  const [state, formAction, pending] = useActionState<ActionResult | undefined, FormData>(
    upsertAdSpendAction,
    undefined,
  );
  return (
    <form action={formAction} className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl">
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
        <Label htmlFor="month">Month</Label>
        <Input id="month" name="month" defaultValue={currentMonthKey()} placeholder="2026-04" required />
      </div>
      <div>
        <Label htmlFor="spendAmount">Spend (CAD)</Label>
        <Input id="spendAmount" name="spendAmount" type="number" step="0.01" min="0" required />
      </div>
      <div>
        <Label htmlFor="impressions">Impressions</Label>
        <Input id="impressions" name="impressions" type="number" min="0" />
      </div>
      <div>
        <Label htmlFor="clicks">Clicks</Label>
        <Input id="clicks" name="clicks" type="number" min="0" />
      </div>
      <div>
        <Label htmlFor="conversions">Conversions</Label>
        <Input id="conversions" name="conversions" type="number" min="0" />
      </div>
      <div className="md:col-span-3">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>
      {state?.ok === false ? (
        <div className="md:col-span-3">
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        </div>
      ) : null}
      <div className="md:col-span-3 flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save spend (upsert by customer + month)"}
        </Button>
      </div>
    </form>
  );
}
