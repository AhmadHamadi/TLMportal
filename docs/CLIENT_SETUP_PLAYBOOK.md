# Client Setup Playbook

This is the repeatable setup checklist for each contractor customer. The goal is simple: launch tracking, collect leads, book estimate appointments, and keep Google Ads/SEO/GBP work organized.

## Client-facing promise

Use simple language:
- Leads come in from forms, calls, and texts.
- TLM follows up and helps book estimate appointments.
- The contractor sees leads, booked appointments, call logs, and ad spend summaries.
- Closed jobs and sales outcomes are the contractor's responsibility.

Avoid making the dashboard about raw/qualified/billable/disputed stages. Keep those as internal admin protections only.

## New customer setup

1. Create customer in `/admin/customers/new`.
2. Select active packages:
   - Lead Engine
   - Google Ads management
   - Website / landing page
   - Local SEO
   - Google Business Profile
3. Enter pricing:
   - Lead Engine monthly retainer
   - booked appointment fee if applicable
   - SEO/GBP flat retainer, normally `$750/month`
   - Google Ads monthly budget, paid by client directly to Google
4. Add service areas and services offered.
5. Create contractor portal user.
6. Start onboarding checklist from `/admin/onboarding/[customerId]`.

## Landing page setup prompt

Use this with Claude/Codex when creating a contractor landing page:

```text
Build a mobile-first contractor landing page for [business name], a [trade/niche] company serving [cities/areas].
Goal: generate estimate requests and phone calls.
Primary CTA: Request an estimate.
Secondary CTA: Call now.
Include: hero, trust section, services, service areas, project photos placeholder, review/testimonial section, FAQ, estimate form, phone CTA sticky on mobile.
Form fields: name, phone, email optional, city, service requested, project details, preferred time.
Tone: professional, local, direct, no exaggerated guarantees.
Tracking requirements: submit to TLM portal lead endpoint later, preserve source/campaign fields, support Google Ads conversion tracking, use Twilio tracking number for phone CTA.
```

## Google Ads manager setup

Use a Google Ads Manager Account (MCC) for TLM.

For each client:
1. Client keeps ownership of their Google Ads account and pays Google directly.
2. TLM requests manager access from the MCC using the client Google Ads customer ID.
3. Client approves the manager link inside Google Ads.
4. Store the customer ID in the portal.
5. Set link status manually until API integration is added.
6. Configure conversion tracking for forms and calls.
7. Track monthly ad budget in the customer record.
8. Contractor can request budget increase/decrease from their portal; admin gets a notification.

## Google Business Profile setup

Preferred access:
- Client remains owner.
- TLM is added as manager.

Checklist:
1. Confirm GBP name, address/service area, primary category, phone, website.
2. Add services matching the portal service list.
3. Add photos and service descriptions.
4. Set review request workflow.
5. Record access status in onboarding notes.

## Twilio tracking number setup

For each Lead Engine customer:
1. Buy/provision one tracking number.
2. Assign it to the customer in the portal.
3. Set forwarding phone to the contractor's preferred phone.
4. Configure inbound voice webhook to `/api/webhooks/twilio/voice`.
5. Configure inbound SMS webhook to `/api/webhooks/twilio/sms`.
6. Confirm missed-call text-back is active.
7. Confirm calls appear in contractor dashboard call logs.
8. Confirm form/SMS booked appointments appear in contractor dashboard.

Production note:
- Use per-customer A2P 10DLC setup when SMS volume requires it.
- Keep Twilio/Auth/Stripe secrets only in environment variables.

## Admin dashboard workflow

Daily admin checks:
1. New leads.
2. Missed calls and recent tracking calls.
3. SMS replies needing follow-up.
4. Booked appointments needing contractor answer.
5. Google Ads budget change requests.
6. Customers with incomplete onboarding.
7. Monthly reports.

## Contractor dashboard workflow

Main page should show:
- total leads
- booked appointments
- booking percentage
- tracked calls
- recent call logs
- form/SMS booked appointments
- Google Ads spend summary
- Google Ads budget change request form

This keeps the client portal simple and focused on what the contractor cares about.

## Monthly Google Ads budget confirmation

At the beginning of each month, TLM should confirm the client's Google Ads budget for the next 30 days.

Client-facing rule:
- Minimum recommended budget is 700 in CAD or USD.
- Contractor can keep, increase, decrease, or change the budget from the portal.
- TLM should also text the contractor monthly: "Do you want to keep your Google Ads budget at [amount] for the next 30 days? Reply KEEP or send a new amount. Minimum 700."

Portal behavior:
- Contractor submits next 30-day budget request from the dashboard.
- Request creates an admin notification.
- `/api/cron/monthly-ad-budget` texts active Google Ads clients on the first of each month, deduped by customer/month.
- Admin updates the customer monthly ad budget and Google Ads account manually until API automation is added.
