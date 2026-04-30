# Competitive Review - Contractor Lead Engine Portal

Reviewed against common agency/contractor platforms: GoHighLevel, ServiceTitan, Jobber, Housecall Pro, and similar field-service CRMs.

## Where Those Tools Are Strong

### GoHighLevel
- White-label agency CRM.
- Landing pages, funnels, forms, calendars, conversations, SMS/email automations.
- Unified inbox and pipeline management.
- Reputation/review request workflows.
- Good client-facing agency layer.

### ServiceTitan
- Deep contractor operations: dispatch, scheduling, job costing, call tracking, reporting, customer portal, field technician workflows.
- Strong for larger trades companies with trucks, techs, pricebooks, and dispatch complexity.
- Marketing attribution is valuable, but the platform can be heavy and expensive.

### Jobber / Housecall Pro
- Simple contractor-friendly workflows.
- Quotes, estimates, invoices, online booking, payments, client hub.
- Better for small field-service businesses that need job management more than marketing accountability.

## Our Best Positioning
TLM Portal should not try to become a full field-service operating system. The sharper wedge is:

- Agency-controlled lead tracking.
- Proof of lead source and appointment status.
- Contractor confirmation workflow.
- Booking and billing accountability.
- Monthly marketing performance reporting.
- Clean contractor mobile portal.

This is the layer that generic CRMs and field-service tools often handle poorly: proving which marketing leads turned into booked estimate appointments.

## Must-Have Client Experience
For contractors, the portal should feel simpler than a CRM:

1. What leads came in?
2. Who do I need to call/text now?
3. Which appointments did I accept?
4. What am I being charged for?
5. How do I ask TLM to review a bad lead?
6. What did my ad spend produce this month?

If a screen does not answer one of those questions, it should be admin-only or hidden from the contractor.

## Feature Gap Checklist
Already strong:
- Customer records and pricing config.
- Lead table and detail page.
- Contractor mobile lead/appointment views.
- Twilio call/SMS logging and contractor replies.
- Billing records and internal review workflow.
- Manual Google Ads spend and monthly reports.
- Onboarding checklist and contract templates.
- Email notifications and weekly digests.
- Missed-call text-back for unanswered tracking-number calls.

Recommended next:
- Password reset and secure invite-token flow.
- Integration health page for Twilio, Stripe, email, AI, database.
- Review request workflow after COMPLETED_ESTIMATE.
- Contractor response-time metric and SLA alerts.
- Lead quality dashboard: booked appointment rate and cost per booked appointment.
- Client-facing monthly report email with PDF link or attached report.
- Playwright smoke tests for admin and contractor flows.

Avoid for now:
- Full dispatch board.
- Technician GPS tracking.
- Field estimates/invoices beyond the appointment-fee billing model.
- Complex website builder inside the portal.
- Full social/reputation suite unless it directly supports contractor retention.

## Reporting Standard
Monthly reports should show:
- Leads by source.
- Calls, forms, and SMS replies.
- Confirmed appointments.
- Booked appointments.
- Internal reviews opened/approved/rejected.
- Ad spend.
- Cost per lead.
- Cost per confirmed appointment.
- Cost per booked appointment.
- Recommended next actions for the next month.

## Onboarding Standard
Every new customer should have:
- Business/contact info.
- Forwarding phone.
- Services offered.
- Service areas.
- Minimum job size.
- Setup fee, retainer, appointment fee, ad budget.
- Google Ads customer ID.
- Tracking number.
- Landing page URL.
- Contractor portal user.
- Signed agreement or contract URL.
- Test lead and test call before launch.

## Email/SMS Standard
Critical operational messages should be short and direct:
- New lead alert.
- Appointment accepted/declined.
- No contractor response after 24h.
- Internal review opened/resolved.
- Weekly/monthly performance summary.

Do not let AI or templates promise discounts, exact arrival times, warranties, or guaranteed results.

## SMS Workflow Benchmarks

Recent product docs and public help centers confirm the same pattern across the best home-service tools:

- GoHighLevel supports calendar SMS reminders, configurable timing, and two-way SMS conversation history.
- ServiceTitan emphasizes automated confirmations/reminders and contractor-grade scheduling rather than generic CRM notes.
- Housecall Pro supports customizable SMS job reminders before scheduled work.
- Jobber supports two-way texting, dedicated numbers, automated appointment reminders, and conversation history tied to clients/visits.

Design implication for TLM Portal:

- Match the market standard: automated confirmation/reminder texts, two-way history, and clean customer-facing wording.
- Keep our differentiator: tie every message to lead source, appointment booked appointment status and agency billing proof.
- Do not try to out-ServiceTitan ServiceTitan with dispatch, tech GPS, or pricebooks. That is not the wedge.
- Do beat generic CRMs on lead accountability: who came in, who replied, what time was agreed, who accepted, what became a booked appointment and whether it needed internal review.

Useful references:

- GoHighLevel appointment notifications: https://help.gohighlevel.com/support/solutions/articles/155000003441-calendar-email-in-app-appointment-notifications
- GoHighLevel two-way SMS overview: https://www.gohighlevel.com/post/highlevel-2-way-sms-and-social-messaging-features
- ServiceTitan appointment confirmation guidance: https://www.servicetitan.com/guides/contractor-playbook/confirming-appointments
- Housecall Pro SMS job reminders: https://help.housecallpro.com/en/articles/8688152-setting-up-sms-job-reminders
- Jobber two-way texting: https://help.getjobber.com/hc/en-us/articles/360051087154-Two-Way-Text-Messaging
- Jobber assessment and visit reminders: https://help.getjobber.com/hc/en-us/articles/360033608974-Assessment-and-Visit-Reminders
