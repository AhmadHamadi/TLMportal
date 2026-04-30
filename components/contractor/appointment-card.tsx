"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Phone, ChevronRight, Check, X } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatNational } from "@/lib/phone";
import { formatDateTime } from "@/lib/dates";
import {
  canRevealLeadContactToContractor,
  contractorLeadVisibilityMessage,
} from "@/lib/lead-visibility";
import { decideAppointmentAction } from "@/server/actions/appointments";
import { toast } from "sonner";

type Appt = {
  id: string;
  leadId: string;
  status: string;
  isBillable: boolean;
  appointmentWindowStart: Date | null;
  lead: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    serviceRequested: string | null;
    status: string;
  };
};

export function AppointmentCard({ appt }: { appt: Appt }) {
  const [pending, start] = useTransition();
  const name =
    [appt.lead.firstName, appt.lead.lastName].filter(Boolean).join(" ") || "Lead";
  const canDecide = ["REQUESTED", "SENT_TO_CONTRACTOR", "CONFIRMED"].includes(appt.status);
  const canRevealContact = canRevealLeadContactToContractor({
    status: appt.lead.status,
    appointment: { status: appt.status },
  });

  return (
    <article className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link
            href={`/contractor/leads/${appt.leadId}`}
            className="block text-base font-semibold leading-tight hover:underline"
          >
            {name}
          </Link>
          <div className="mt-0.5 text-sm text-muted-foreground truncate">
            {appt.lead.serviceRequested ?? "-"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {appt.appointmentWindowStart
              ? formatDateTime(appt.appointmentWindowStart)
              : "Time TBD"}
          </div>
        </div>
        <Link
          href={`/contractor/leads/${appt.leadId}`}
          aria-label="Open lead"
          className="rounded-md p-2 hover:bg-accent"
        >
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge status={appt.status} />
      </div>

      {canDecide ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
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
            <button
              type="submit"
              disabled={pending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground py-2.5 text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition"
            >
              <Check className="h-4 w-4" />
              Accept
            </button>
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
            <button
              type="submit"
              disabled={pending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md border py-2.5 text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition"
            >
              <X className="h-4 w-4" />
              Decline
            </button>
          </form>
        </div>
      ) : null}

      {appt.lead.phone && canRevealContact ? (
        <a
          href={`tel:${appt.lead.phone}`}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md border py-2.5 text-sm font-medium hover:bg-muted active:scale-[0.98] transition"
        >
          <Phone className="h-4 w-4" />
          Call {formatNational(appt.lead.phone)}
        </a>
      ) : (
        <p className="mt-2 rounded-md border border-dashed bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {contractorLeadVisibilityMessage({
            status: appt.lead.status,
            appointment: { status: appt.status },
          })}
        </p>
      )}
    </article>
  );
}
