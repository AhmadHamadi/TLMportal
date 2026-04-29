// SMS templates per the project spec. Variables are simple {{var}} replaced.
// Never let AI-drafted content promise prices, discounts, warranties, or specific
// appointment times. Templates only.

export const SMS_TEMPLATES = {
  newLeadAck: ({
    firstName,
    service,
  }: {
    firstName: string;
    service: string;
  }) =>
    `Hi ${firstName}, thanks for requesting a quote for ${service}. What city or neighbourhood are you located in, and what days/times work best for a quick estimate?`,

  askProjectDetails: () =>
    `Thanks. Can you briefly describe the project? For example: driveway, patio, walkway, steps, concrete pad, interlock, or backyard work.`,

  askPhotos: () =>
    `If you have photos of the area, you can send them here. That helps the contractor understand the project before the estimate.`,

  contractorSummary: ({
    service,
    cityOrNeighbourhood,
    preferredTime,
    projectDetails,
  }: {
    service: string;
    cityOrNeighbourhood: string;
    preferredTime: string;
    projectDetails: string;
  }) =>
    `New estimate request for ${service} in ${cityOrNeighbourhood}. Preferred time: ${preferredTime}. Project notes: ${projectDetails}. Reply YES to accept, NO to decline, BUSY for another time, or BAD to dispute.`,

  contractorAccepted: ({
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
  }) =>
    `Confirmed. Lead details: ${leadName}, ${leadPhone}, ${leadAddressOrArea}, ${preferredTime}, ${projectDetails}.`,

  leadConfirmation: ({ firstName }: { firstName: string }) =>
    `Thanks ${firstName}, your estimate request has been sent over. We'll follow up shortly to confirm the best time.`,
};
