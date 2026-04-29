# Lead Visibility And Billing Policy

This policy protects the agency billing model while keeping contractors confident that real work is happening.

## Recommendation

Show contractors all lead records, but gate full contact details until the lead becomes a confirmed booked opportunity.

Contractors can see before confirmation:

- Lead received time.
- Lead source.
- Service requested.
- City/neighbourhood.
- Status and billable status.
- Appointment request/availability summary.
- Activity timeline showing TLM follow-up.

Contractors cannot see before confirmation:

- Full phone number.
- Email address.
- Street address.
- One-tap call/text buttons.

Full contact details unlock when:

- Appointment is accepted by contractor.
- Appointment is confirmed/completed.
- Lead reaches later statuses such as completed estimate, quoted, or won.

## Why This Is The Best Balance

- Contractors see all lead volume, so they trust the marketing work.
- The agency prevents bypassing the pay-per-booked-appointment workflow.
- Bad/spam/duplicate leads can still be shown as proof without giving away contact details.
- Billing disputes become easier because each stage is logged.

## Phone Call Edge Cases

Tracking calls are harder than forms because the caller may speak to someone before qualification.

Current protections:

- Calls go through Twilio tracking numbers.
- Calls are logged.
- Missed calls trigger automatic text-back.
- Contractor portal does not reveal stored lead contact details until accepted/confirmed.

Additional future protections:

- Use tracking number as caller ID where practical.
- Add consented call recording/transcription.
- Add call duration and outcome rules for qualification.
- Optionally route calls to TLM/answering service first for clients on strict pay-per-booked-appointment plans.

## Billing Model Rules

Retainer plus booked appointment fee:

- Appointment fee is greater than $0.
- Contractor contact details unlock after accepted/confirmed opportunity.
- Billing record should only be created for confirmed billable appointments.

Retainer only:

- Appointment fee is $0.
- Dashboard can still show leads and appointments, but billing copy should not imply per-lead/per-appointment charges.
- Disputes still matter for quality reporting, not appointment-fee billing.

## Contractor Review Requests

Contractors should not be able to self-remove a billable appointment from billing.
That creates too much operational drag and encourages repeated disputes.

Current rule:

- Contractor portal shows formal review history, but does not include a direct
  "file dispute" form.
- Contractor can contact TLM if they believe a lead violates the signed rules.
- Contractor can reply `BAD` by SMS to flag a lead for review.
- `BAD` creates an admin notification and lead timeline event only. It does not
  automatically mark the lead not billable or disputed.
- Admin reviews evidence and decides whether to open/approve a formal dispute.

This protects TLM and the contractor:

- Contractors are not charged for leads that truly violate the agreement.
- TLM is not forced into automatic credits because of one-click disputes.
- Every billing adjustment remains evidence-based and admin-reviewed.

## Customer Happiness Rule

The portal should never feel like leads are being hidden. It should feel like TLM is doing the filtering work for them.

Use language like:

- "TLM is qualifying this lead."
- "Accept the appointment to unlock full contact details."
- "This lead was marked not billable because..."

Avoid language like:

- "Hidden lead."
- "Locked customer."
- "Pay to unlock."
