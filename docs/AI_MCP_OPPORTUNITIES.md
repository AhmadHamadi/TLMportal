# AI, MCP, And Service Opportunities

This document captures useful integrations that could improve the portal or become add-on services for contractors.

## MCP / Tooling Opportunities

### Playwright Browser MCP

Best use:

- Visual smoke tests for admin and contractor dashboards.
- Mobile navigation checks for contractor pages.
- Login, lead detail, appointment accept, dispute filing, billing review, and onboarding wizard flows.
- Screenshot evidence before shipping client-facing changes.

Current status:

- No Playwright/browser MCP tool is exposed in this thread.
- Recommendation: enable a Playwright MCP/browser tool in the Codex/Claude environment, then add repeatable smoke scripts.

Priority smoke paths:

1. Admin login -> dashboard -> leads -> lead detail.
2. Contractor login -> leads -> lead detail -> call/text buttons visible.
3. Contractor appointments -> accept/decline actions visible.
4. Contractor billing -> clear fees, statuses, and dispute windows.
5. Admin onboarding -> customer checklist -> tracking number -> invite user.

### Memory / Handoff MCP

Best use:

- Store project decisions, provider setup notes, client-specific quirks, and deployment runbooks.
- Prevent future agents from re-arguing settled architecture.

Current durable files already help:

- `AGENTS.md`
- `CLAUDE.md`
- `docs/OPERATIONS.md`
- `docs/SMS_APPOINTMENT_WORKFLOW.md`
- `docs/COMPETITIVE_REVIEW.md`

### Browser Research MCP

Best use:

- Periodically compare TLM Portal against GoHighLevel, ServiceTitan, Jobber, Housecall Pro, CallRail, WhatConverts, and LeadConnector.
- Track Twilio A2P 10DLC, Vercel, Neon, Stripe, and email deliverability changes.

## AI Features Worth Building

### Lead Quality Assistant

Sellable value: helps contractors understand why some leads are billable and some are not.

Inputs:

- Lead source, transcript/SMS, service requested, area, project size, duplicate history, dispute reason.

Outputs:

- Quality score.
- Suggested billable/not-billable reason.
- Admin review note.
- Contractor-friendly explanation.

Guardrail: AI suggests, admin decides.

### Call Summary And Missed-Call Recovery

Sellable value: protects paid calls and makes contractors look responsive.

Inputs:

- Call status, recording/transcript if legally enabled, SMS replies.

Outputs:

- Missed-call text-back.
- Call summary.
- Follow-up task.
- Response-time metric.

Guardrail: call recording/transcription needs consent language and local legal review.

### Monthly Growth Coach

Sellable value: turns reporting into retention.

Inputs:

- Leads, calls, appointments, disputes, ad spend, cost per lead, cost per billable appointment, won/lost notes.

Outputs:

- Plain-English monthly summary.
- What improved.
- What needs work.
- Next-month recommendations.
- Contractor-facing email/report.

### Niche-Specific Intake Prompts

Sellable value: better lead quality and faster estimates by trade.

Examples:

- Concrete: square footage, remove old material, photos, access, timeline.
- Roofing: leak urgency, roof age/type, photos, address.
- HVAC: repair/replacement, system age, urgency, model if known.
- Landscaping: scope, timeline, photos, budget range if useful.

Guardrail: prompts should be customer-configurable, not hardcoded in webhook routes.

### Reputation And Review Engine

Sellable value: a natural upsell after appointments and completed estimates.

Flow:

- Appointment completed or job won.
- Contractor confirms customer is happy.
- System sends review request.
- Admin sees reviews requested, clicked, completed.

Guardrail: comply with Google review policies. Do not gate reviews by sentiment.

## Sellable Add-On Services

1. Missed-call text-back and speed-to-lead automation.
2. Contractor lead-response SLA dashboard.
3. Monthly lead quality and ROI report.
4. Review request automation.
5. Google Business Profile posting and review response support.
6. Call recording/transcription package, only with consent and disclosure.
7. AI ad optimization recommendations.
8. Niche landing page + intake optimization package.

## Real-Life Edge Cases To Cover

- Caller hangs up before forwarding completes.
- Contractor phone is busy or voicemail answers.
- Lead texts photos instead of availability.
- Lead asks price before appointment.
- Lead is outside service area.
- Lead wants service the contractor does not offer.
- Duplicate lead submits form and calls.
- Contractor replies with free text instead of `YES/BUSY/NO/BAD`.
- Contractor disputes after the dispute window.
- Twilio retries the same webhook.
- Stripe webhook arrives before local billing state is updated.
- Email provider is configured but DNS/authentication is incomplete.
- Contractor has multiple users or multiple tracking numbers.
- Seasonal contractors pause campaigns during winter.

## Product Rule

Contractors should not feel like they are using a complicated CRM. They should see:

- New leads.
- Who needs action now.
- Confirmed appointments.
- What they are being charged for.
- How to dispute bad leads.
- What their marketing produced this month.

Everything else belongs in the admin side.
