import { db } from "@/lib/db";
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
import { Hash } from "lucide-react";
import { formatNational } from "@/lib/phone";

export const metadata = { title: "Tracking numbers — Admin" };

export default async function TrackingNumbersPage() {
  await requireAdmin();
  const numbers = await db.trackingNumber.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { businessName: true } } },
  });
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tracking numbers</h1>
        <p className="text-sm text-muted-foreground">
          Twilio numbers assigned per customer. Live provisioning ships in Phase 6.
        </p>
      </div>
      {numbers.length === 0 ? (
        <EmptyState icon={Hash} title="No tracking numbers" />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Forwards to</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {numbers.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="font-mono text-sm">
                    {formatNational(n.twilioPhoneNumber)}
                  </TableCell>
                  <TableCell className="text-sm">{n.customer.businessName}</TableCell>
                  <TableCell className="text-sm">{formatNational(n.forwardingPhoneNumber)}</TableCell>
                  <TableCell className="text-sm">{n.label ?? "—"}</TableCell>
                  <TableCell><StatusBadge status={n.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
