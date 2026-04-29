# Client Onboarding Access Playbook

This playbook keeps client onboarding simple while preserving ownership and reducing support headaches.

## Recommended Account Flow

Best default for contractor portal users:

1. Admin creates the contractor user during onboarding.
2. Admin sets a temporary password or sends an invite email with the temporary password.
3. Contractor logs in at `/login`.
4. Contractor immediately changes their password in `/contractor/settings`.
5. Longer term, replace temporary passwords with a secure invite-token flow where the contractor sets their own password from a one-time link.

Why this is best right now:

- It is fast during onboarding calls.
- It avoids asking busy contractors to create accounts from scratch.
- It gives the agency control that the account exists before launch.
- The new password-change page gives the contractor a safe self-serve path after first login.

Do not use a permanent shared password. If a password is sent by email/SMS, treat it as temporary.

## Google Ads Manager Account

Use one Google Ads Manager Account, formerly MCC, for the agency. Each contractor should have their own client Google Ads account under the manager account.

Recommended options:

1. Existing client Google Ads account: send a link request from the agency Manager Account using the client's Google Ads Customer ID. The client accepts under Access and security > Managers.
2. New client with no ads account: create a new Google Ads account from the agency Manager Account, then add the client as a user and make sure billing ownership/payment setup is clear.

Operational rule:

- Keep one Google Ads account per contractor/business/domain when possible.
- The contractor should pay ad spend directly unless your contract says otherwise.
- Store the Google Ads Customer ID in the portal customer record.
- Do not mix multiple unrelated contractors in one Google Ads account.

Official references:

- Google Ads Manager linking: https://support.google.com/google-ads/answer/7459601
- Google Ads API manager linking: https://developers.google.com/google-ads/api/docs/account-management/linking-manager-accounts

## Google Business Profile Access

Best practice:

- Client keeps primary ownership of their Google Business Profile.
- Agency is added as a Manager or Owner only if contractually appropriate.
- Avoid taking over ownership unless the client explicitly requests it and understands the consequence.

Onboarding task:

- Ask client to add the agency Google account as a manager to their Business Profile.
- If they do not know who owns the profile, help them recover/request ownership through Google.

Official reference:

- Google Business Profile owner/manager access: https://support.google.com/business/answer/4573962

## Google Search Console

Best practice:

- Verify the domain property when possible.
- Client/domain owner should remain a verified owner.
- Agency can be delegated owner or full user depending on scope.

Official reference:

- Search Console users and permissions: https://support.google.com/webmasters/answer/7687615

## Domain And DNS

For GoDaddy/Outlook clients:

- Client can keep domain ownership at GoDaddy.
- Agency should request delegated/domain DNS access or screenshare setup.
- Email DNS must not be broken when adding website, landing page, Resend, or verification records.

Common records to manage:

- Website/landing page CNAME or A record.
- Google site verification TXT record.
- Resend SPF/DKIM/DMARC records if sending branded email.
- Microsoft 365/Outlook MX, SPF, DKIM, Autodiscover records must stay intact.

## Google Review Request Service

This is a strong future upsell after appointments/jobs are completed.

Safe workflow:

1. Contractor marks estimate/job completed or won.
2. System asks contractor whether the customer is appropriate for a review request.
3. System sends a neutral review request link.
4. Portal tracks sent/clicked/completed if possible.

Important policy guardrail:

- Do not only ask happy customers for reviews.
- Do not offer incentives for reviews.
- Do not pressure customers to leave positive reviews.

## Portal Onboarding Checklist Additions

Add/confirm these for each customer:

- Contractor portal user created.
- Temporary password delivered securely.
- Contractor changed password.
- Google Ads Customer ID stored.
- Google Ads Manager link accepted.
- Google Business Profile access granted.
- Search Console access granted or domain verified.
- Domain/DNS access confirmed.
- Outlook/Microsoft 365 email records protected.
- Tracking number test call passed.
- Missed-call text-back test passed.
- Test form lead passed.
- Test SMS availability flow passed.
- Stripe subscription/payment setup confirmed.
- Review request link captured for future automation.
