// SMS templates for lead-to-contractor appointment coordination.
// Keep these short, clear, and non-promissory. Do not promise exact arrival
// times, prices, discounts, warranties, or guaranteed results.

function clean(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

export const SMS_TEMPLATES = {
  leadAvailabilityRequest({
    firstName,
    service,
    businessName,
  }: {
    firstName?: string | null;
    service?: string | null;
    businessName?: string | null;
  }) {
    const name = clean(firstName, "there");
    const requestedService = clean(service, "your project");
    const contractor = clean(businessName, "the contractor");
    return `Hi ${name}, thanks for requesting an estimate for ${requestedService}. What day/time works best for ${contractor} to call or visit? Reply with 1-2 options.`;
  },

  leadAvailabilityReceived({ firstName }: { firstName?: string | null }) {
    return `Thanks ${clean(firstName, "there")}. We are checking that time with the contractor now and will confirm shortly.`;
  },

  askProjectDetails() {
    return "Thanks. Can you briefly describe the project? For example: driveway, patio, walkway, steps, concrete pad, interlock, or backyard work.";
  },

  askPhotos() {
    return "If you have photos of the area, you can send them here. That helps the contractor understand the project before the estimate.";
  },

  contractorProposedTime({
    leadName,
    service,
    cityOrNeighbourhood,
    preferredTime,
    projectDetails,
  }: {
    leadName?: string | null;
    service?: string | null;
    cityOrNeighbourhood?: string | null;
    preferredTime?: string | null;
    projectDetails?: string | null;
  }) {
    return `Estimate request: ${clean(leadName, "Lead")} wants ${clean(service, "a project")} in ${clean(cityOrNeighbourhood, "your area")}. Requested time: ${clean(preferredTime, "flexible")}. Notes: ${clean(projectDetails, "none")}. Reply YES if that works, BUSY with a better time, NO to decline, or BAD to flag for review.`;
  },

  contractorAccepted({
    leadName,
    leadPhone,
    leadAddressOrArea,
    preferredTime,
    projectDetails,
  }: {
    leadName: string;
    leadPhone: string;
    leadAddressOrArea: string;
    preferredTime: string;
    projectDetails: string;
  }) {
    return `Confirmed. Lead details: ${leadName}, ${leadPhone}, ${leadAddressOrArea}, requested time: ${preferredTime}. Notes: ${projectDetails}.`;
  },

  leadAppointmentConfirmed({
    firstName,
    businessName,
    preferredTime,
  }: {
    firstName?: string | null;
    businessName?: string | null;
    preferredTime?: string | null;
  }) {
    return `Thanks ${clean(firstName, "there")}. ${clean(businessName, "The contractor")} confirmed your requested time: ${clean(preferredTime, "the time you provided")}. Please reply here if anything changes.`;
  },

  leadAlternativeTimeNeeded({
    firstName,
    businessName,
  }: {
    firstName?: string | null;
    businessName?: string | null;
  }) {
    return `Thanks ${clean(firstName, "there")}. ${clean(businessName, "The contractor")} needs a different time. Please reply with another 1-2 options that work for you.`;
  },

  missedCallTextBack({
    businessName,
    service,
  }: {
    businessName?: string | null;
    service?: string | null;
  }) {
    return `Sorry we missed your call to ${clean(businessName, "the contractor")}. What can we help with for ${clean(service, "your project")}? Reply with your project details and 1-2 good times for a callback.`;
  },

  monthlyAdBudgetConfirmation({
    businessName,
    amount,
    currency,
  }: {
    businessName?: string | null;
    amount: string;
    currency: "CAD" | "USD";
  }) {
    return `Hi ${clean(businessName, "there")}, do you want to keep your Google Ads budget at ${currency} ${amount} for the next 30 days? Reply KEEP or send a new amount. Minimum 700.`;
  },
};
