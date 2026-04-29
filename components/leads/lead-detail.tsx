import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { formatNational } from "@/lib/phone";
import { LeadStatusForm } from "./lead-status-form";
import { LeadBillableForm } from "./lead-billable-form";
import { AppointmentSection } from "./appointment-section";
import type { Prisma } from "@prisma/client";

type LeadWithRelations = Prisma.LeadGetPayload<{
  include: {
    customer: { select: { id: true; businessName: true; slug: true; disputeWindowHours: true } };
    appointment: true;
    events: { include: { createdByUser: { select: { name: true; email: true } } } };
    callLogs: true;
    smsMessages: true;
    disputes: true;
  };
}>;

export function LeadDetail({
  lead,
  viewerRole,
}: {
  lead: LeadWithRelations;
  viewerRole: "ADMIN" | "CONTRACTOR";
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Unnamed lead"}
            </h1>
            <StatusBadge status={lead.status} />
            <StatusBadge status={lead.billableStatus} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {lead.customer.businessName} · {lead.source.replace(/_/g, " ")} · created{" "}
            {formatDateTime(lead.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Lead details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Phone" value={lead.phone ? formatNational(lead.phone) : "—"} />
            <Row label="Email" value={lead.email ?? "—"} />
            <Row
              label="Location"
              value={
                [lead.address, lead.neighbourhood, lead.city].filter(Boolean).join(", ") || "—"
              }
            />
            <Row label="Service requested" value={lead.serviceRequested ?? "—"} />
            <Row
              label="Project size estimate"
              value={lead.estimatedProjectSize ? formatMoney(lead.estimatedProjectSize) : "—"}
            />
            <Row label="Preferred time" value={lead.preferredTime ?? "—"} />
            {lead.projectDetails ? (
              <>
                <Separator />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Project notes</div>
                  <div className="whitespace-pre-wrap">{lead.projectDetails}</div>
                </div>
              </>
            ) : null}
            {lead.notBillableReason ? (
              <>
                <Separator />
                <Row
                  label="Not-billable reason"
                  value={lead.notBillableReason.replace(/_/g, " ")}
                />
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <LeadStatusForm leadId={lead.id} viewerRole={viewerRole} />
            {viewerRole === "ADMIN" ? (
              <LeadBillableForm leadId={lead.id} current={lead.billableStatus} />
            ) : null}
          </CardContent>
        </Card>
      </div>

      <AppointmentSection lead={lead} viewerRole={viewerRole} />

      <Card>
        <CardHeader><CardTitle>Activity timeline</CardTitle></CardHeader>
        <CardContent>
          {lead.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : (
            <ol className="space-y-3">
              {lead.events.map((e) => (
                <li key={e.id} className="text-sm border-l-2 pl-3">
                  <div className="font-medium">{e.type.replace(/_/g, " ")}</div>
                  <div className="text-muted-foreground text-xs">
                    {formatDateTime(e.createdAt)}
                    {e.createdByUser ? ` · ${e.createdByUser.name ?? e.createdByUser.email}` : ""}
                  </div>
                  {e.description ? <div className="mt-1">{e.description}</div> : null}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="text-muted-foreground">{label}</div>
      <div className="col-span-2">{value}</div>
    </div>
  );
}
