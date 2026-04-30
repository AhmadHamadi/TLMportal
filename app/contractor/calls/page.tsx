import Link from "next/link";
import { Phone } from "lucide-react";
import { contractorCallLogData } from "@/server/services/billing";
import { requireContractor } from "@/lib/auth-guard";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/dates";
import { formatNational } from "@/lib/phone";

export const metadata = { title: "Call Log - TLM Portal" };

function leadName(lead: { firstName: string | null; lastName: string | null } | null) {
  if (!lead) return "No lead attached";
  return [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Lead";
}

export default async function ContractorCallsPage() {
  const ctx = await requireContractor();
  const calls = await contractorCallLogData(ctx);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Call log</h1>
        <p className="text-sm text-muted-foreground">
          Calls from your tracking number that forwarded to your phone.
        </p>
      </div>

      {calls.length === 0 ? (
        <EmptyState icon={Phone} title="No tracked calls yet" description="Calls from the tracking number will show here." />
      ) : (
        <div className="grid gap-3">
          {calls.map((call) => (
            <Card key={call.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                  <span>{formatNational(call.fromNumber)}</span>
                  <StatusBadge status={call.lead?.appointment ? "BOOKED_APPOINTMENT" : "LEAD"} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="grid gap-1 sm:grid-cols-2">
                  <p>Called: {formatDateTime(call.createdAt)}</p>
                  <p>Duration: {call.durationSeconds}s</p>
                  <p>Tracking number: {formatNational(call.trackingNumber)}</p>
                  <p>Status: {call.callStatus}</p>
                </div>
                {call.lead ? (
                  <Link href={`/contractor/leads/${call.lead.id}`} className="block rounded-md border bg-muted/40 p-3 hover:bg-muted">
                    <span className="font-medium text-foreground">{leadName(call.lead)}</span>
                    <span className="block text-xs">
                      {call.lead.serviceRequested ?? "Estimate request"}
                    </span>
                  </Link>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
