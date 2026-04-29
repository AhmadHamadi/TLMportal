"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  generateRecommendationsAction,
  type RecResult,
} from "@/server/actions/ad-recommendations";
import { Sparkles } from "lucide-react";

const PRIORITY_COLOR: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300",
  medium: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
  low: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
};

export function AdRecommendationsForm({
  customerId,
  defaultLandingPageUrl,
  disabled,
}: {
  customerId: string;
  defaultLandingPageUrl: string;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState<RecResult | undefined, FormData>(
    generateRecommendationsAction,
    undefined,
  );

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4 rounded-lg border bg-card p-4 max-w-3xl">
        <input type="hidden" name="customerId" value={customerId} />
        <div>
          <Label htmlFor="landingPageUrl">Landing page URL</Label>
          <Input
            id="landingPageUrl"
            name="landingPageUrl"
            type="url"
            defaultValue={defaultLandingPageUrl}
            placeholder="https://your-landing.example/concrete-driveways"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label htmlFor="spend">Spend (CAD)</Label>
            <Input id="spend" name="spend" type="number" step="0.01" min="0" placeholder="1840" />
          </div>
          <div>
            <Label htmlFor="impressions">Impressions</Label>
            <Input id="impressions" name="impressions" type="number" min="0" placeholder="28500" />
          </div>
          <div>
            <Label htmlFor="clicks">Clicks</Label>
            <Input id="clicks" name="clicks" type="number" min="0" placeholder="412" />
          </div>
          <div>
            <Label htmlFor="conversions">Conversions</Label>
            <Input id="conversions" name="conversions" type="number" min="0" placeholder="18" />
          </div>
        </div>
        <div>
          <Label htmlFor="notes">Notes / context</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="What we've tried, what's working, what isn't, current goals..."
          />
        </div>
        <Button type="submit" disabled={pending || disabled} className="gap-2">
          <Sparkles className="h-4 w-4" />
          {pending ? "Analysing..." : "Generate recommendations"}
        </Button>
      </form>

      {state?.ok === false ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      {state?.ok === true ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed">{state.data.summary}</CardContent>
          </Card>

          {state.data.warnings.length > 0 ? (
            <Alert>
              <AlertDescription>
                <strong>Watch:</strong>
                <ul className="mt-1 list-disc list-inside space-y-0.5">
                  {state.data.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {state.data.recommendations.map((rec, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline">{rec.category}</Badge>
                    <Badge variant="outline" className={PRIORITY_COLOR[rec.priority] ?? ""}>
                      {rec.priority}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold mt-2">{rec.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-muted-foreground">
                  {rec.detail}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
