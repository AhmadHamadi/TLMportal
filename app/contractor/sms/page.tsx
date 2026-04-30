import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { contractorSmsSummaryData } from "@/server/services/billing";
import { requireContractor } from "@/lib/auth-guard";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/dates";

export const metadata = { title: "SMS Summary - TLM Portal" };

function leadName(lead: { firstName: string | null; lastName: string | null }) {
  return [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Lead";
}

export default async function ContractorSmsPage() {
  const ctx = await requireContractor();
  const leads = await contractorSmsSummaryData(ctx);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">SMS summary</h1>
        <p className="text-sm text-muted-foreground">
          See which leads were texted and whether they became booked appointments.
        </p>
      </div>

      {leads.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No SMS conversations yet" description="SMS follow-up will show here once leads reply." />
      ) : (
        <div className="grid gap-3">
          {leads.map((lead) => (
            <Card key={lead.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                  <Link href={`/contractor/leads/${lead.id}`} className="hover:underline">
                    {leadName(lead)}
                  </Link>
                  <StatusBadge status={lead.appointment ? "BOOKED_APPOINTMENT" : "NOT_BOOKED"} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="text-muted-foreground">
                  {lead.serviceRequested ?? "Estimate request"}
                  {lead.city ? ` - ${lead.city}` : ""}
                  {lead.preferredTime ? ` - preferred: ${lead.preferredTime}` : ""}
                </div>
                {lead.appointment ? (
                  <div className="rounded-md border bg-muted/40 p-3 text-muted-foreground">
                    Booked appointment status: {lead.appointment.status.replace(/_/g, " ")}
                    {lead.appointment.appointmentWindowStart ? ` - ${formatDateTime(lead.appointment.appointmentWindowStart)}` : ""}
                  </div>
                ) : null}
                <div className="space-y-2">
                  {lead.smsMessages.map((sms) => (
                    <div key={sms.id} className="rounded-md border p-2">
                      <div className="mb-1 text-xs text-muted-foreground">
                        {sms.direction} - {formatDateTime(sms.createdAt)}
                      </div>
                      <p className="line-clamp-2 text-muted-foreground">{sms.body}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
