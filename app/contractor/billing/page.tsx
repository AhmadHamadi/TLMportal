import { listBillingRecords } from "@/server/services/billing";
import { requireContractor } from "@/lib/auth-guard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Receipt } from "lucide-react";
import { formatDateTime } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Billing — TLM Portal" };

export default async function ContractorBillingPage() {
  const ctx = await requireContractor();
  const records = await listBillingRecords(ctx);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Your retainer and appointment fee history.
        </p>
      </div>
      {records.length === 0 ? (
        <EmptyState icon={Receipt} title="No billing yet" />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-sm">{r.billingMonth}</TableCell>
                  <TableCell className="text-sm">{r.type.replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.description ?? (r.lead ? `${r.lead.firstName ?? ""} ${r.lead.lastName ?? ""}`.trim() : "")}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(r.amount)}
                  </TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-xs">{formatDateTime(r.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
