# Email Setup - GoDaddy, Outlook, Resend

## Recommendation
Use Resend for portal-generated transactional email and keep your GoDaddy/Microsoft 365 Outlook mailbox for normal human email.

Why:
- Resend is built for app email, API sending, DKIM verification, and deliverability monitoring.
- Microsoft 365 SMTP can work, but SMTP AUTH may need to be enabled for the mailbox and can be more fragile for app sending.
- Contractors care that emails come from your domain and do not land in spam. DNS authentication matters more than the sending tool name.

## Option A - Recommended: Send From Resend Using Your Domain
Use this for portal invites, new lead alerts, weekly digests, and reports.

Environment variables:

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=...
RESEND_FROM_EMAIL="Trade Leads Marketing <portal@yourdomain.com>"
```

DNS at GoDaddy:
- Add the Resend-provided SPF/DKIM records for the sending domain or subdomain.
- Add a DMARC TXT record if one does not already exist.
- If your normal mailbox is Microsoft 365, do not create two SPF TXT records. Merge all allowed senders into one SPF record.

Safer sending pattern:
- Use `portal@yourdomain.com`, `notifications@yourdomain.com`, or `leads@yourdomain.com` for app email.
- Set reply-to to your real Outlook inbox when needed.
- Keep human email on Outlook, app email on Resend.

## Option B - Microsoft 365 / Outlook SMTP
Use this if you specifically want the portal to send directly through your Outlook mailbox.

Environment variables:

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@yourdomain.com
SMTP_PASSWORD=your-mailbox-password-or-app-password
SMTP_FROM_EMAIL="Trade Leads Marketing <you@yourdomain.com>"
```

Important:
- SMTP uses STARTTLS on port 587, so `SMTP_SECURE=false` is expected.
- SMTP AUTH must be enabled for the mailbox in Microsoft 365/Exchange settings.
- If multi-factor auth is enabled, you may need an app password or a different Microsoft-supported sending method.
- This can put portal emails into the mailbox Sent folder, depending on Microsoft behavior and tenant settings.

## DNS Checklist For Your GoDaddy Domain
At minimum, configure:

1. MX records for Microsoft 365 so your Outlook mailbox receives mail.
2. SPF TXT record with all services allowed to send for the domain.
3. DKIM for Microsoft 365 from the Microsoft Defender portal.
4. DKIM for Resend if using Resend.
5. DMARC TXT record, starting with monitor mode:

```txt
_dmarc  TXT  v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

After confirming legitimate mail passes SPF/DKIM, move toward stricter policies later:

```txt
_dmarc  TXT  v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

Eventually, when everything is stable:

```txt
_dmarc  TXT  v=DMARC1; p=reject; rua=mailto:dmarc@yourdomain.com
```

## SPF Warning
A domain must have one SPF TXT record. Multiple SPF records can cause SPF failure.

Example only, not universal:

```txt
@ TXT v=spf1 include:spf.protection.outlook.com include:amazonses.com -all
```

Use the exact include values provided by Microsoft 365/GoDaddy and Resend.

## Portal Behavior
The portal now supports:
- Resend if `EMAIL_PROVIDER=resend` or Resend variables are present.
- SMTP if `EMAIL_PROVIDER=smtp` or SMTP variables are present.
- Simulated mode if neither provider is configured.

Simulated mode keeps development safe: code paths work, but no real email sends.

## Best Client Experience
For contractor trust:
- From name: `Trade Leads Marketing` or `TLM Portal`.
- From address: `portal@yourdomain.com` or `leads@yourdomain.com`.
- Reply-to: your real Outlook inbox.
- Subject lines should be plain and useful: `New lead: Concrete driveway in Mississauga`.
- Include a direct portal link and the contractor's business name.
- Do not send marketing blasts from the same address used for critical lead alerts.
