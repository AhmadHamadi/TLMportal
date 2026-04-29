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
import { EmptyState } from "@/components/shared/empty-state";
import { Phone } from "lucide-react";
import { formatDateTime } from "@/lib/dates";
import { formatNational } from "@/lib/phone";

export const metadata = { title: "Calls — Admin" };

export default async function AdminCallsPage() {
  await requireAdmin();
  const calls = await db.callLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { customer: { select: { businessName: true } } },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Calls</h1>
        <p className="text-sm text-muted-foreground">
          Twilio call logs. Live integration ships in Phase 6.
        </p>
      </div>
      {calls.length === 0 ? (
        <EmptyState
          icon={Phone}
          title="No calls logged yet"
          description="Call logging starts when Twilio webhooks are wired in Phase 6."
        />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-xs">{formatDateTime(c.createdAt)}</TableCell>
                  <TableCell className="text-sm">{c.customer.businessName}</TableCell>
                  <TableCell className="text-sm">{formatNational(c.fromNumber)}</TableCell>
                  <TableCell className="text-sm">{formatNational(c.toNumber)}</TableCell>
                  <TableCell className="text-sm">{c.durationSeconds}s</TableCell>
                  <TableCell className="text-sm">{c.callStatus}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
