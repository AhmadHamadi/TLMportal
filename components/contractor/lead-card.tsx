import Link from "next/link";
import { Phone, MessageSquare, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatNational } from "@/lib/phone";
import { formatDateTime } from "@/lib/dates";
import {
  canRevealLeadContactToContractor,
  contractorLeadVisibilityMessage,
} from "@/lib/lead-visibility";

type LeadCardLead = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  city: string | null;
  serviceRequested: string | null;
  status: string;
  billableStatus: string;
  createdAt: Date;
  appointment?: { status: string } | null;
};

export function LeadCard({ lead }: { lead: LeadCardLead }) {
  const name =
    [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Unnamed lead";
  const canRevealContact = canRevealLeadContactToContractor(lead);

  return (
    <article className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link
            href={`/contractor/leads/${lead.id}`}
            className="block text-base font-semibold leading-tight hover:underline"
          >
            {name}
          </Link>
          <div className="mt-0.5 text-sm text-muted-foreground truncate">
            {lead.serviceRequested ?? "-"}
            {lead.city ? ` - ${lead.city}` : ""}
          </div>
        </div>
        <Link
          href={`/contractor/leads/${lead.id}`}
          aria-label="Open lead"
          className="rounded-md p-2 hover:bg-accent"
        >
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge status={lead.status} />
        <span className="text-xs text-muted-foreground self-center">
          {formatDateTime(lead.createdAt)}
        </span>
      </div>

      {lead.phone && canRevealContact ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <a
            href={`tel:${lead.phone}`}
            className="inline-flex items-center justify-center gap-2 rounded-md border bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90 active:scale-[0.98] transition"
          >
            <Phone className="h-4 w-4" />
            Call {formatNational(lead.phone)}
          </a>
          <a
            href={`sms:${lead.phone}`}
            className="inline-flex items-center justify-center gap-2 rounded-md border bg-card py-2.5 text-sm font-medium hover:bg-muted active:scale-[0.98] transition"
          >
            <MessageSquare className="h-4 w-4" />
            Text
          </a>
        </div>
      ) : (
        <div className="mt-4 rounded-md border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          {contractorLeadVisibilityMessage(lead)}
        </div>
      )}
    </article>
  );
}
