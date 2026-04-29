"use client";

import { useTransition, useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime } from "@/lib/dates";
import {
  createAppointmentAction,
  decideAppointmentAction,
  adminConfirmAppointmentAction,
  adminSendToContractorAction,
  approveAppointmentFeeAction,
  type ActionResult,
} from "@/server/actions/appointments";
import { toast } from "sonner";
import type { Prisma } from "@prisma/client";

type LeadShape = Prisma.LeadGetPayload<{
  include: {
    appointment: true;
    customer: { select: { id: true; businessName: true; slug: true; disputeWindowHours: true } };
  };
}>;

export function AppointmentSection({
  lead,
  viewerRole,
}: {
  lead: LeadShape;
  viewerRole: "ADMIN" | "CONTRACTOR";
}) {
  const [createState, createAction, creating] = useActionState<ActionResult | undefined, FormData>(
    createAppointmentAction,
    undefined,
  );
  const [pending, start] = useTransition();

  if (!lead.appointment) {
    return (
      <Card>
        <CardHeader><CardTitle>Appointment</CardTitle></CardHeader>
        <CardContent>
          <form action={createAction} className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl">
            <input type="hidden" name="leadId" value={lead.id} />
            <div>
              <Label htmlFor="appointmentWindowStart">Window start</Label>
              <Input id="appointmentWindowStart" name="appointmentWindowStart" type="datetime-local" />
            </div>
            <div>
              <Label htmlFor="appointmentWindowEnd">Window end</Label>
              <Input id="appointmentWindowEnd" name="appointmentWindowEnd" type="datetime-local" />
            </div>
            <div className="md:col-span-3">
              <Label htmlFor="notes">Notes</Label>
              <Textarea name="notes" rows={2} />
            </div>
            {createState && createState.ok === false ? (
              <div className="md:col-span-3">
                <Alert variant="destructive">
                  <AlertDescription>{createState.error}</AlertDescription>
                </Alert>
              </div>
            ) : null}
            <div className="md:col-span-3">
              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create appointment"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  const appt = lead.appointment;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Appointment <StatusBadge status={appt.status} />
          {appt.isBillable ? <StatusBadge status="BILLABLE" /> : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Row label="Window" value={
          appt.appointmentWindowStart
            ? `${formatDateTime(appt.appointmentWindowStart)}${
                appt.appointmentWindowEnd ? ` → ${formatDateTime(appt.appointmentWindowEnd)}` : ""
              }`
            : "—"
        } />
        <Row label="Confirmed" value={formatDateTime(appt.confirmedAt)} />
        <Row label="Sent to contractor" value={formatDateTime(appt.sentToContractorAt)} />
        <Row label="Accepted" value={formatDateTime(appt.acceptedByContractorAt)} />
        <Row label="Dispute window ends" value={formatDateTime(appt.disputeWindowEndsAt)} />
        {appt.notes ? <Row label="Notes" value={appt.notes} /> : null}

        <div className="flex flex-wrap gap-2 pt-3">
          {viewerRole === "ADMIN" && appt.status !== "CONFIRMED" ? (
            <form
              action={(fd) => {
                start(async () => {
                  await adminConfirmAppointmentAction(fd);
                  toast.success("Marked as confirmed");
                });
              }}
            >
              <input type="hidden" name="appointmentId" value={appt.id} />
              <Button type="submit" size="sm" variant="outline" disabled={pending}>
                Mark confirmed
              </Button>
            </form>
          ) : null}
          {viewerRole === "ADMIN" && !appt.sentToContractorAt ? (
            <form
              action={(fd) => {
                start(async () => {
                  await adminSendToContractorAction(fd);
                  toast.success("Marked as sent to contractor");
                });
              }}
            >
              <input type="hidden" name="appointmentId" value={appt.id} />
              <Button type="submit" size="sm" variant="outline" disabled={pending}>
                Mark sent to contractor
              </Button>
            </form>
          ) : null}
          {viewerRole === "ADMIN" && appt.isBillable ? (
            <form
              action={(fd) => {
                start(async () => {
                  await approveAppointmentFeeAction(fd);
                  toast.success("Appointment fee approved");
                });
              }}
            >
              <input type="hidden" name="appointmentId" value={appt.id} />
              <Button type="submit" size="sm" disabled={pending}>
                Approve appointment fee
              </Button>
            </form>
          ) : null}
          {viewerRole === "CONTRACTOR" &&
          (appt.status === "REQUESTED" || appt.status === "SENT_TO_CONTRACTOR" || appt.status === "CONFIRMED") ? (
            <>
              <form
                action={(fd) => {
                  start(async () => {
                    await decideAppointmentAction(fd);
                    toast.success("Accepted");
                  });
                }}
              >
                <input type="hidden" name="appointmentId" value={appt.id} />
                <input type="hidden" name="decision" value="ACCEPT" />
                <Button type="submit" size="sm" disabled={pending}>Accept</Button>
              </form>
              <form
                action={(fd) => {
                  start(async () => {
                    await decideAppointmentAction(fd);
                    toast.success("Declined");
                  });
                }}
              >
                <input type="hidden" name="appointmentId" value={appt.id} />
                <input type="hidden" name="decision" value="DECLINE" />
                <Button type="submit" size="sm" variant="outline" disabled={pending}>
                  Decline
                </Button>
              </form>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
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
