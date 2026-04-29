"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LEAD_STATUS_VALUES } from "@/schemas/lead";
import { updateLeadStatusAction } from "@/server/actions/leads";
import { toast } from "sonner";

const CONTRACTOR_STATUSES = [
  "QUOTED",
  "WON",
  "LOST",
  "COMPLETED_ESTIMATE",
] as const;

export function LeadStatusForm({
  leadId,
  viewerRole,
}: {
  leadId: string;
  viewerRole: "ADMIN" | "CONTRACTOR";
}) {
  const [pending, start] = useTransition();
  const allowed =
    viewerRole === "ADMIN" ? LEAD_STATUS_VALUES : (CONTRACTOR_STATUSES as readonly string[]);

  return (
    <form
      className="space-y-2"
      action={(fd) => {
        start(async () => {
          await updateLeadStatusAction(fd);
          toast.success("Status updated");
        });
      }}
    >
      <input type="hidden" name="leadId" value={leadId} />
      <Label htmlFor="status">Update status</Label>
      <Select name="status" required>
        <SelectTrigger id="status"><SelectValue placeholder="Choose status" /></SelectTrigger>
        <SelectContent>
          {allowed.map((s) => (
            <SelectItem key={s} value={s}>
              {s.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Textarea name="note" placeholder="Note (optional)" rows={2} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving..." : "Apply"}
      </Button>
    </form>
  );
}
