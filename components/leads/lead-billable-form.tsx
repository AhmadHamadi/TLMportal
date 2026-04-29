"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BILLABLE_STATUS_VALUES, NOT_BILLABLE_REASON_VALUES } from "@/schemas/lead";
import { setLeadBillableAction } from "@/server/actions/leads";
import { toast } from "sonner";

export function LeadBillableForm({
  leadId,
  current,
}: {
  leadId: string;
  current: string;
}) {
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-2"
      action={(fd) => {
        start(async () => {
          await setLeadBillableAction(fd);
          toast.success("Billable status updated");
        });
      }}
    >
      <input type="hidden" name="leadId" value={leadId} />
      <Label>Billable</Label>
      <Select name="billableStatus" defaultValue={current}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {BILLABLE_STATUS_VALUES.map((s) => (
            <SelectItem key={s} value={s}>
              {s.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Label>Reason (if not billable)</Label>
      <Select name="notBillableReason">
        <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
        <SelectContent>
          {NOT_BILLABLE_REASON_VALUES.map((s) => (
            <SelectItem key={s} value={s}>
              {s.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" variant="outline" disabled={pending} className="w-full">
        {pending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
