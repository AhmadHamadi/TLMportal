// HTML email templates for TLM Portal. Brand-aligned with the dashboard:
// navy header, orange accent, clean serif-free body. Inline CSS for client compat.

const BRAND = {
  navy: "#0A1B3D",
  orange: "#F37021",
  ink: "#0F172A",
  body: "#475569",
  border: "#E2E8F0",
  bg: "#F8FAFC",
};

function shell({
  preheader,
  heading,
  body,
  ctaLabel,
  ctaUrl,
  footer = "Trade Leads Marketing — Lead Engine for contractors.",
}: {
  preheader: string;
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footer?: string;
}): string {
  const ctaBlock = ctaLabel && ctaUrl
    ? `<div style="text-align:center;padding:8px 0 24px">
        <a href="${ctaUrl}" style="display:inline-block;background:${BRAND.orange};color:#fff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:8px;font-size:15px">${ctaLabel}</a>
      </div>`
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Helvetica,Arial,sans-serif;color:${BRAND.ink};">
<div style="display:none!important;visibility:hidden;opacity:0;height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;">${preheader}</div>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${BRAND.bg};padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;width:100%;background:#fff;border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
      <tr>
        <td style="background:${BRAND.navy};padding:18px 24px;color:#fff;">
          <span style="font-weight:700;font-size:15px;letter-spacing:-0.01em;">Trade Leads Marketing</span>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 28px 8px;">
          <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;font-weight:700;color:${BRAND.ink};">${heading}</h1>
          <div style="font-size:14px;line-height:1.55;color:${BRAND.body};">${body}</div>
        </td>
      </tr>
      <tr><td style="padding:0 28px;">${ctaBlock}</td></tr>
      <tr>
        <td style="border-top:1px solid ${BRAND.border};padding:16px 28px;font-size:12px;color:${BRAND.body};">
          ${footer}
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export const EmailTemplates = {
  portalInvite({
    name,
    email,
    tempPassword,
    portalUrl,
  }: {
    name: string;
    email: string;
    tempPassword: string;
    portalUrl: string;
  }): { subject: string; html: string } {
    return {
      subject: "Your TLM Portal access",
      html: shell({
        preheader: "Sign in to your contractor dashboard.",
        heading: `Hi ${name}, your TLM Portal is ready`,
        body: `
          <p>Your account has been set up. From the portal you can review every lead, accept or decline appointments, and see your billing in one place — designed for your phone.</p>
          <p style="margin:14px 0 8px;"><strong>Email:</strong> ${email}</p>
          <p style="margin:0 0 14px;"><strong>Temporary password:</strong> <code style="background:${BRAND.bg};border:1px solid ${BRAND.border};padding:2px 6px;border-radius:4px;">${tempPassword}</code></p>
          <p>Please change your password after the first sign-in.</p>
        `,
        ctaLabel: "Sign in",
        ctaUrl: portalUrl,
      }),
    };
  },

  newLeadAlert({
    contractorName,
    leadName,
    service,
    cityOrArea,
    preferredTime,
    leadUrl,
  }: {
    contractorName: string;
    leadName: string;
    service: string;
    cityOrArea: string;
    preferredTime: string;
    leadUrl: string;
  }): { subject: string; html: string } {
    return {
      subject: `New lead: ${leadName} — ${service}`,
      html: shell({
        preheader: `${leadName} requested ${service} in ${cityOrArea}.`,
        heading: `Hi ${contractorName}, new lead just came in`,
        body: `
          <p><strong>${leadName}</strong> wants <strong>${service}</strong> in ${cityOrArea}.</p>
          <p>Preferred time: <em>${preferredTime}</em>.</p>
          <p>Open the portal to call them, accept the appointment, or send them a quick text.</p>
        `,
        ctaLabel: "Open in TLM Portal",
        ctaUrl: leadUrl,
      }),
    };
  },

  monthlyDigest({
    contractorName,
    monthLabel,
    leads,
    confirmed,
    billable,
    estimatedCharges,
    portalUrl,
  }: {
    contractorName: string;
    monthLabel: string;
    leads: number;
    confirmed: number;
    billable: number;
    estimatedCharges: string;
    portalUrl: string;
  }): { subject: string; html: string } {
    return {
      subject: `Your ${monthLabel} summary — TLM`,
      html: shell({
        preheader: `${leads} leads · ${confirmed} confirmed · ${estimatedCharges} estimated.`,
        heading: `${monthLabel} performance`,
        body: `
          <p>Hi ${contractorName}, quick recap of your month:</p>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:14px 0;border-collapse:collapse;">
            <tr><td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.body};">Leads</td><td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};text-align:right;font-weight:600;">${leads}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.body};">Confirmed appointments</td><td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};text-align:right;font-weight:600;">${confirmed}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.body};">Billable appointments</td><td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};text-align:right;font-weight:600;">${billable}</td></tr>
            <tr><td style="padding:8px 0;color:${BRAND.body};">Estimated charges</td><td style="padding:8px 0;text-align:right;font-weight:700;color:${BRAND.orange};">${estimatedCharges}</td></tr>
          </table>
        `,
        ctaLabel: "Open dashboard",
        ctaUrl: portalUrl,
      }),
    };
  },
};
