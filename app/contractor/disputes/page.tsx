import Link from "next/link";
import { listDisputes } from "@/server/services/disputes";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ShieldAlert } from "lucide-react";
import { formatDateTime } from "@/lib/dates";

export const metadata = { title: "Lead reviews - TLM Portal" };

export default async function ContractorDisputesPage() {
  const ctx = await requireContractor();
  const items = await listDisputes(ctx);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lead reviews</h1>
        <p className="text-sm text-muted-foreground">
          TLM reviews lead quality against your signed rules. If something looks wrong, contact us and we will review the call, SMS, form, appointment status, and service-area fit.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How reviews work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Contractors cannot self-remove booked appointments from billing in the portal. This keeps the process fair and prevents accidental or repeated disputes.
          </p>
          <p>
            If a lead is spam, wrong number, outside your service area, below minimum project size, or not a service you offer, message TLM with the lead name and reason. We will review and adjust billing when the evidence supports it.
          </p>
          <p>
            You can also reply <span className="font-medium text-foreground">BAD</span> by SMS to flag a lead for admin review, but it does not automatically void the appointment fee.
          </p>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No lead reviews yet" description="Any formal reviews opened by TLM will appear here." />
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
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-sm">
                    {[d.lead.firstName, d.lead.lastName].filter(Boolean).join(" ") || "-"}
                  </TableCell>
                  <TableCell className="text-sm max-w-xs truncate">{d.reason}</TableCell>
                  <TableCell className="text-xs">{formatDateTime(d.submittedAt)}</TableCell>
                  <TableCell className="text-xs">{formatDateTime(d.reviewedAt)}</TableCell>
                  <TableCell><StatusBadge status={d.status} /></TableCell>
                  <TableCell>
                    <Link href={`/contractor/leads/${d.leadId}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                      Lead
                    </Link>
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
