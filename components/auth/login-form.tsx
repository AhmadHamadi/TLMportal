"use client";

import { useActionState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BrandMark } from "@/components/shared/brand-mark";
import { loginAction } from "@/server/actions/auth";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex flex-col items-center text-center space-y-2">
        <BrandMark size={48} showWordmark={false} />
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Trade Leads Marketing
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your dashboard.
        </p>
      </div>
      <Card className="shadow-lg border-[#E2E8F0]">
        <CardContent className="pt-6">
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {state?.error ? (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="text-center text-xs text-muted-foreground">
        Contractor accounts are created by your TLM account manager.
      </p>
    </div>
  );
}
