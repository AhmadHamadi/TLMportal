import { listBillingRecords, monthlySummary } from "@/server/services/billing";
import { requireAdmin } from "@/lib/auth-guard";
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
import { formatDateTime } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { Receipt } from "lucide-react";

export const metadata = { title: "Billing — Admin" };

export default async function AdminBillingPage() {
  const ctx = await requireAdmin();
  const [records, summary] = await Promise.all([
    listBillingRecords(ctx),
    monthlySummary(ctx),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          {summary.month} — Stripe sync ships in Phase 7.
        </p>
      </div>

      {records.length === 0 ? (
        <EmptyState icon={Receipt} title="No billing records yet" />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm font-mono">{r.billingMonth}</TableCell>
                  <TableCell className="text-sm">{r.customer.businessName}</TableCell>
                  <TableCell className="text-sm">{r.type.replace(/_/g, " ")}</TableCell>
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
