import { auth } from "@/auth";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logoutAction } from "@/server/actions/auth";
import { LogOut } from "lucide-react";

export const metadata = { title: "Settings - TLM Portal" };

export default async function ContractorSettingsPage() {
  const session = await auth();
  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div>
            <span className="text-muted-foreground">Name: </span>
            {session?.user.name ?? "-"}
          </div>
          <div>
            <span className="text-muted-foreground">Email: </span>
            {session?.user.email}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
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
