import Link from "next/link";
import { listAppointments } from "@/server/services/appointments";
import { requireAdmin } from "@/lib/auth-guard";
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
import { CalendarCheck } from "lucide-react";

export const metadata = { title: "Booked Appointments - Admin" };

export default async function AdminAppointmentsPage() {
  const ctx = await requireAdmin();
  const items = await listAppointments(ctx);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Booked appointments</h1>
        <p className="text-sm text-muted-foreground">
          Estimate appointments across customers. Keep this simple: leads come in, TLM books appointments.
        </p>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No booked appointments yet" />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Window</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-sm">{a.customer.businessName}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {[a.lead.firstName, a.lead.lastName].filter(Boolean).join(" ") || "-"}
                  </TableCell>
                  <TableCell className="text-sm">{a.lead.serviceRequested ?? "-"}</TableCell>
                  <TableCell className="text-xs">
                    {formatDateTime(a.appointmentWindowStart)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/leads/${a.leadId}`}
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
