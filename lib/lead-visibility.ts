import type { AppointmentStatus, LeadStatus } from "@prisma/client";

const CONTACT_VISIBLE_LEAD_STATUSES = new Set<LeadStatus>([
  "APPOINTMENT_CONFIRMED",
  "ACCEPTED_BY_CONTRACTOR",
  "COMPLETED_ESTIMATE",
  "QUOTED",
]);

const CONTACT_VISIBLE_APPOINTMENT_STATUSES = new Set<AppointmentStatus>([
  "ACCEPTED",
  "CONFIRMED",
  "COMPLETED",
]);

export function canRevealLeadContactToContractor(lead: {
  status: LeadStatus | string;
  appointment?: { status: AppointmentStatus | string } | null;
}): boolean {
  return (
    CONTACT_VISIBLE_LEAD_STATUSES.has(lead.status as LeadStatus) ||
    CONTACT_VISIBLE_APPOINTMENT_STATUSES.has(lead.appointment?.status as AppointmentStatus)
  );
}

export function contractorLeadVisibilityMessage(lead: {
  status: LeadStatus | string;
  appointment?: { status: AppointmentStatus | string } | null;
}): string {
  if (canRevealLeadContactToContractor(lead)) {
    return "Contact details are available for this confirmed opportunity.";
  }
  if (lead.appointment?.status === "SENT_TO_CONTRACTOR" || lead.status === "SENT_TO_CONTRACTOR") {
    return "TLM has qualified this request. Accept the appointment to unlock full contact details.";
  }
  return "TLM is qualifying this lead. Contact details unlock after a confirmed booked appointment.";
}
