import Link from "next/link";
import { listDisputes } from "@/server/services/disputes";
import { db } from "@/lib/db";
import { requireContractor } from "@/lib/auth-guard";
import { buttonVariants } from "@/components/ui/button";
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
import { FileDisputeForm } from "@/components/disputes/file-dispute-form";

export const metadata = { title: "Disputes — TLM Portal" };

export default async function ContractorDisputesPage() {
  const ctx = await requireContractor();
  const [items, openWindowAppts] = await Promise.all([
    listDisputes(ctx),
    db.appointment.findMany({
      where: {
        customerId: { in: ctx.customerIds },
        isBillable: true,
        disputeWindowEndsAt: { gt: new Date() },
      },
      include: {
        lead: { select: { id: true, firstName: true, lastName: true } },
        disputes: { where: { status: "OPEN" } },
      },
      orderBy: { acceptedByContractorAt: "desc" },
    }),
  ]);
  const disputableAppts = openWindowAppts.filter((a) => a.disputes.length === 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Disputes</h1>
        <p className="text-sm text-muted-foreground">
          You have a dispute window after a billable appointment is accepted. After it
          closes, the lead is locked in as billable.
        </p>
      </div>

      {disputableAppts.length > 0 ? (
        <div className="rounded-md border bg-card p-4 space-y-4">
          <h2 className="text-sm font-medium">Open a dispute</h2>
          {disputableAppts.map((a) => (
            <div key={a.id} className="space-y-2 border-t pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">
                    {[a.lead.firstName, a.lead.lastName].filter(Boolean).join(" ") || "Lead"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Window closes {formatDateTime(a.disputeWindowEndsAt)}
                  </div>
                </div>
                <Link
                  href={`/contractor/leads/${a.leadId}`}
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  Open lead
                </Link>
              </div>
              <FileDisputeForm appointmentId={a.id} />
            </div>
          ))}
        </div>
      ) : null}

      {items.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No disputes" />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Reviewed</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-sm">
                    {[d.lead.firstName, d.lead.lastName].filter(Boolean).join(" ") || "—"}
                  </TableCell>
                  <TableCell className="text-sm max-w-xs truncate">{d.reason}</TableCell>
                  <TableCell className="text-xs">{formatDateTime(d.submittedAt)}</TableCell>
                  <TableCell className="text-xs">{formatDateTime(d.reviewedAt)}</TableCell>
                  <TableCell><StatusBadge status={d.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
