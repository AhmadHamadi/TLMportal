# Lead Visibility And Billing Policy

This policy protects the agency billing model while keeping contractors confident that real work is happening.

## Recommendation

Show contractors all lead records, but gate full contact details until the lead becomes a confirmed booked opportunity.

Contractors can see before confirmation:

- Lead received time.
- Lead source.
- Service requested.
- City/neighbourhood.
- Status and booked appointment status.
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
- Lead reaches later statuses such as completed estimate or quoted.

## Why This Is The Best Balance

- Contractors see all lead volume, so they trust the marketing work.
- The agency prevents bypassing the pay-per-booked-appointment workflow.
- Bad/spam/duplicate leads can still be shown as proof without giving away contact details.
- Billing internal reviews become easier because each stage is logged.

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
- Billing record should only be created for confirmed booked appointments.

Retainer only:

- Appointment fee is $0.
- Dashboard can still show leads and appointments, but billing copy should not imply per-lead/per-appointment charges.
- Internal reviews still matter for quality reporting, not appointment-fee billing.

## Contractor Review Requests

Contractors should not be able to self-remove a booked appointment from billing.
That creates too much operational drag and encourages repeated internal reviews.

Current rule:

- Contractor portal shows formal review history, but does not include a direct
  "file dispute" form.
- Contractor can contact TLM if they believe a lead violates the signed rules.
- Contractor can reply `BAD` by SMS to flag a lead for review.
- `BAD` creates an admin notification and lead timeline event only. It does not
  automatically mark the lead not chargeable without admin review.
- Admin reviews evidence and decides whether to credit or keep the booked appointment fee.

This protects TLM and the contractor:

- Contractors are not charged for leads that truly violate the agreement.
- TLM is not forced into automatic credits because of one-click internal reviews.
- Every billing adjustment remains evidence-based and admin-reviewed.

## Customer Happiness Rule

The portal should never feel like leads are being hidden. It should feel like TLM is doing the filtering work for them.

Use language like:

- "TLM is qualifying this lead."
- "Accept the appointment to unlock full contact details."
- "TLM reviewed this lead because..."

Avoid language like:

- "Hidden lead."
- "Locked customer."
- "Pay to unlock."

## Contractor portal experience

The contractor portal should prioritize what the contractor needs to act on, not internal agency operations.

Show first:
- appointment requests that need accept/decline
- upcoming estimate calendar
- unread lead/appointment notifications
- recent lead statuses
- monthly performance and billing summary

Notification channel rule:
- SMS is primary for urgent appointment coordination, accept/decline prompts, missed-call recovery, and reminders.
- Email is backup for invoices, reports, onboarding records, and non-urgent summaries.
- Portal notifications are the in-app audit trail of what was sent or requested.

The portal should make TLM look proactive: leads are being contacted, availability is being gathered, and booked opportunities are being protected before the contractor sees full homeowner contact details.

## SEO/GBP pricing rule

SEO and Google Business Profile work should not use the booked-appointment fee model.

Recommended rule:
- Lead Engine: monthly retainer plus optional booked appointment fee.
- Google Ads: client pays ad spend directly to Google; TLM tracks and manages performance.
- SEO/GBP: flat $750/month retainer when either Local SEO or GBP management is selected.
- Website work: separate setup/project fee or monthly maintenance package, not appointment-based.

Reason:
- SEO and GBP usually take months to compound, so appointment-fee pricing creates cash-flow risk for TLM and confusing expectations for the client.
- The SEO/GBP promise should be visibility, profile quality, review workflow, local content, and reporting, not immediate booked appointments.
- If a customer buys both Lead Engine and SEO/GBP, their dashboard should show both: booked appointment operations for Lead Engine and visibility/GBP progress for SEO.
