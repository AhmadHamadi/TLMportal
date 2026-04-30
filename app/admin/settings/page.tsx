import { LogOut } from "lucide-react";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { logoutAction } from "@/server/actions/auth";
import { StatusBadge } from "@/components/shared/status-badge";
import { env } from "@/lib/env";
import { isEmailConfigured, getEmailProvider } from "@/lib/email";
import { isStripeConfigured } from "@/lib/stripe";
import { isTwilioConfigured } from "@/lib/twilio";

export const metadata = { title: "Settings - Admin" };

export default function AdminSettingsPage() {
  const integrationChecks = [
    {
      label: "App URL",
      ok: env.APP_URL.startsWith("https://") || env.NODE_ENV !== "production",
      detail: env.APP_URL,
    },
    {
      label: "Cron secret",
      ok: Boolean(env.CRON_SECRET) || env.NODE_ENV !== "production",
      detail: env.CRON_SECRET ? "Configured" : "Required in production",
    },
    {
      label: "Twilio",
      ok: isTwilioConfigured(),
      detail: isTwilioConfigured() ? "Live SMS/calls enabled" : "Simulated until credentials are set",
    },
    {
      label: "Stripe",
      ok: isStripeConfigured() && Boolean(env.STRIPE_WEBHOOK_SECRET),
      detail: isStripeConfigured() ? "Secret key set" : "Billing remains DB-only until configured",
    },
    {
      label: "Email",
      ok: isEmailConfigured(),
      detail: isEmailConfigured()
        ? `Provider: ${getEmailProvider()}`
        : "Invites/digests simulate until Resend or SMTP is set",
    },
    {
      label: "AI ad recommendations",
      ok: Boolean(env.ANTHROPIC_API_KEY),
      detail: env.ANTHROPIC_API_KEY ? "Enabled" : "Optional; recommendations disabled",
    },
  ];

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Agency settings</CardTitle>
          <CardDescription>Core agency defaults will live here later.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Per-agency settings such as notification preferences, default internal review window, and default fees will live here.
          </p>
          <p>For now, settings are configured per customer on the customer detail page.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Integration health</CardTitle>
          <CardDescription>
            Production readiness checks without exposing secret values.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {integrationChecks.map((check) => (
            <div
              key={check.label}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background p-3"
            >
              <div>
                <div className="text-sm font-medium">{check.label}</div>
                <div className="text-xs text-muted-foreground">{check.detail}</div>
              </div>
              <StatusBadge status={check.ok ? "ACTIVE" : "PENDING"} />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>Update the password for your own admin account.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
      <form action={logoutAction}>
        <Button type="submit" variant="outline" className="w-full gap-2">
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </form>
    </div>
  );
}
