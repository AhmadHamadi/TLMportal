import { BILLABLE_STATUS_VALUES, NOT_BILLABLE_REASON_VALUES } from "@/schemas/lead";
import { setLeadBillableAction } from "@/server/actions/leads";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LeadBillableForm({
  leadId,
  current,
}: {
  leadId: string;
  current: string;
}) {
  return (
    <form action={setLeadBillableAction} className="space-y-2 rounded-md border bg-muted/30 p-3">
      <input type="hidden" name="leadId" value={leadId} />
      <Label>Internal billing status</Label>
      <Select name="billableStatus" defaultValue={current}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {BILLABLE_STATUS_VALUES.map((s) => (
            <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Label>Internal review reason</Label>
      <Select name="notBillableReason">
        <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
        <SelectContent>
          {NOT_BILLABLE_REASON_VALUES.map((s) => (
            <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" variant="outline" className="w-full">Save internal billing status</Button>
    </form>
  );
}
