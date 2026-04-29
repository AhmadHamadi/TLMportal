"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { inviteUserAction, type ActionResult } from "@/server/actions/customers";

export function InviteUserForm({ customerId }: { customerId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | undefined, FormData>(
    inviteUserAction,
    undefined,
  );
  return (
    <form action={formAction} className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl">
      <input type="hidden" name="customerId" value={customerId} />
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="password">Temporary password</Label>
        <Input id="password" name="password" type="password" required minLength={12} />
        <p className="mt-1 text-xs text-muted-foreground">
          Use 12+ characters with uppercase, lowercase, and a number. Ask the client to change it after first login.
        </p>
      </div>
      {state && state.ok === false ? (
        <div className="md:col-span-3">
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        </div>
      ) : null}
      <div className="md:col-span-3 flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Linking..." : "Invite + link"}
        </Button>
      </div>
    </form>
  );
}
