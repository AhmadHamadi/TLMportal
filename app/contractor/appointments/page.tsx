import Link from "next/link";
import { listAppointments } from "@/server/services/appointments";
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
import { formatDateTime } from "@/lib/dates";
import { formatNational } from "@/lib/phone";
import { CalendarCheck } from "lucide-react";

export const metadata = { title: "Appointments — TLM Portal" };

export default async function ContractorAppointmentsPage() {
  const ctx = await requireContractor();
  const items = await listAppointments(ctx);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Appointments</h1>
        <p className="text-sm text-muted-foreground">
          Open the lead to accept, decline, or dispute.
        </p>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No appointments yet" />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Window</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Billable</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-sm font-medium">
                    {[a.lead.firstName, a.lead.lastName].filter(Boolean).join(" ") || "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {a.lead.phone ? formatNational(a.lead.phone) : "—"}
                  </TableCell>
                  <TableCell className="text-sm">{a.lead.serviceRequested ?? "—"}</TableCell>
                  <TableCell className="text-xs">
                    {formatDateTime(a.appointmentWindowStart)}
                  </TableCell>
                  <TableCell><StatusBadge status={a.status} /></TableCell>
                  <TableCell>
                    {a.isBillable ? <StatusBadge status="BILLABLE" /> : <StatusBadge status="NOT_BILLABLE" />}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/contractor/leads/${a.leadId}`}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      Open lead
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
