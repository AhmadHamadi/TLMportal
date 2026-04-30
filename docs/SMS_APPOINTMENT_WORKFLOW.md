# SMS Appointment Workflow

This portal should coordinate estimates quickly without pretending to be a fully automated human scheduler. The goal is a professional, low-friction consensus between the lead and the contractor, with every message stored on the lead timeline.

## Core Flow

1. Lead submits a landing page form with a valid phone number.
2. The portal creates the lead, notifies the contractor by portal/email, and sends the lead an availability SMS.
3. The lead replies with one or two time windows.
4. The portal stores that reply as `Lead.preferredTime`, creates or updates the lead's `Appointment`, and texts the contractor:
   - Reply `YES` if the requested time works.
   - Reply `BUSY` with a better time if they need a different slot.
   - Reply `NO` to decline.
   - Reply `BAD` to flag an internal review for spam, wrong number, bad fit, or other invalid lead.
5. If contractor replies `YES`, appointment becomes accepted, the internal review window starts, and the lead gets a confirmation SMS.
6. If contractor replies `BUSY`, the lead is asked for alternative options and admin gets a notification to watch the reschedule.
7. If contractor replies `NO`, the appointment is declined.
8. If contractor replies `BAD`, an internal review is logged for admin.

## Missed-Call Text-Back

Missed-call text-back is a must-have because many contractor leads call while
the owner is on a job, driving, or already speaking with another customer.

Current flow:

1. Lead calls the Twilio tracking number.
2. Twilio forwards the call to the contractor forwarding phone.
3. If the forwarded call returns `no-answer`, `busy`, `failed`, or `canceled`,
   the portal creates or attaches a `TRACKING_PHONE_CALL` lead.
4. The portal sends the caller an instant SMS:
   "Sorry we missed your call..." plus a request for project details and 1-2
   callback times.
5. The call, SMS, lead event, and admin notification are logged.
6. Duplicate Twilio callbacks for the same `CallSid` do not send duplicate
   text-backs.

This gives contractors a professional response even when they miss the phone.
It is also a strong sellable service because it protects paid Google Ads calls
from disappearing.

## Message Principles

- Keep SMS short, direct, and non-promissory.
- Never promise exact arrival times, prices, discounts, warranties, or guaranteed outcomes.
- Ask leads for `1-2 options` instead of an open-ended scheduling paragraph.
- Ask contractors for a constrained reply so parsing is reliable.
- Always log inbound and outbound SMS rows with `providerMessageId` for replay safety.
- Treat Twilio webhooks as at-least-once delivery. Duplicate `MessageSid` values must not repeat side effects.

## Niche Customization

Different contractors need different qualifying prompts before confirming an estimate. Store this as customer configuration over time rather than hardcoding it into Twilio webhooks.

Recommended customer-level fields for the next schema pass:

- `smsVoicePrompt`: tone and phrasing guidelines for this contractor.
- `qualificationQuestions`: ordered list of short questions by niche.
- `appointmentInstructions`: what the lead should know before the estimate.
- `reminderCadence`: when to remind lead and contractor.

Examples:

- Concrete/interlock: ask about project type, approximate square footage, photos, access, and whether old material must be removed.
- Roofing: ask about leak urgency, roof type, approximate age, address, and photo availability.
- HVAC: ask about system type, urgency, model/age if known, and whether this is repair or replacement.
- Landscaping: ask about desired service, project scope, timeline, photos, and budget range if useful.

## Reminder Plan

Add reminders after the core webhook path is stable:

- Lead confirmation reminder: 24 hours before appointment.
- Contractor reminder: morning of appointment.
- No-reply escalation: already wired by `/api/cron/no-reply-check` for contractor no-replies after 24 hours.
- Post-estimate admin check: ask contractor whether estimate completed, quote sent or needs follow-up.

## Current Implementation

- Templates live in `lib/sms-templates.ts`.
- SMS business logic lives in `server/services/sms.ts`.
- Twilio inbound SMS routing lives in `app/api/webhooks/twilio/sms/route.ts`.
- Lead creation auto-asks availability for non-manual leads with phone numbers.
- Manual admin-created leads do not auto-text by default, so admins can control edge cases.

## Future Improvements

1. Add per-customer prompt/settings fields for niche-specific SMS qualification.
2. Add an admin UI to preview and edit SMS templates before enabling a client.
3. Add an intent parser for lead replies so photo messages, cancellations, and questions do not always become availability updates.
4. Add reminder jobs after appointment window dates are stored as structured `DateTime` fields instead of free-text preferred time.
5. Add A2P 10DLC onboarding status per customer before production SMS volume.
