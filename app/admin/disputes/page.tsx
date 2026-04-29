import Link from "next/link";
import { listDisputes } from "@/server/services/disputes";
import { requireAdmin } from "@/lib/auth-guard";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { ShieldAlert } from "lucide-react";
import { formatDateTime } from "@/lib/dates";
import { reviewDisputeAction } from "@/server/actions/disputes";

export const metadata = { title: "Lead Reviews - Admin" };

export default async function AdminDisputesPage() {
  const ctx = await requireAdmin();
  const items = await listDisputes(ctx);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lead reviews</h1>
        <p className="text-sm text-muted-foreground">
          Review quality concerns without letting contractor requests automatically void billing.
        </p>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No lead reviews" />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-sm">{d.customer.businessName}</TableCell>
                  <TableCell className="text-sm">
                    {[d.lead.firstName, d.lead.lastName].filter(Boolean).join(" ") || "-"}
                  </TableCell>
                  <TableCell className="text-sm max-w-xs truncate">{d.reason}</TableCell>
                  <TableCell className="text-xs">{formatDateTime(d.submittedAt)}</TableCell>
                  <TableCell>
                    <StatusBadge status={d.status} />
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Link
                      href={`/admin/leads/${d.leadId}`}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      Lead
                    </Link>
                    {d.status === "OPEN" ? (
                      <>
                        <form action={reviewDisputeAction} className="inline">
                          <input type="hidden" name="disputeId" value={d.id} />
                          <input type="hidden" name="decision" value="APPROVED" />
                          <Button type="submit" size="sm" variant="outline">
                            Approve
                          </Button>
                        </form>
                        <form action={reviewDisputeAction} className="inline">
                          <input type="hidden" name="disputeId" value={d.id} />
                          <input type="hidden" name="decision" value="REJECTED" />
                          <Button type="submit" size="sm" variant="outline">
                            Reject
                          </Button>
                        </form>
                      </>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
