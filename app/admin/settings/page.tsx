import { LogOut } from "lucide-react";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { logoutAction } from "@/server/actions/auth";

export const metadata = { title: "Settings - Admin" };

export default function AdminSettingsPage() {
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
            Per-agency settings such as notification preferences, default dispute window, and default fees will live here.
          </p>
          <p>For now, settings are configured per customer on the customer detail page.</p>
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
