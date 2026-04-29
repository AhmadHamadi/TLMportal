"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  ONBOARDING_STATUSES,
  ONBOARDING_TYPES,
} from "@/schemas/onboarding";
import {
  createOnboardingItemAction,
  deleteOnboardingItemAction,
  spawnChecklistAction,
  updateOnboardingItemAction,
  type ActionResult,
} from "@/server/actions/onboarding";

type Item = {
  id: string;
  type: string;
  status: string;
  title: string;
  prompt: string | null;
  notes: string | null;
};

export function OnboardingTab({
  customerId,
  items,
}: {
  customerId: string;
  items: Item[];
}) {
  const [state, formAction, pending] = useActionState<ActionResult | undefined, FormData>(
    createOnboardingItemAction,
    undefined,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Onboarding tasks with the prompts your team uses for landing pages, full sites, SEO, ads,
          and GBP. Hidden from the contractor.
        </p>
        <form action={spawnChecklistAction}>
          <input type="hidden" name="customerId" value={customerId} />
          <Button type="submit" variant="outline" size="sm">
            Spawn default checklist
          </Button>
        </form>
      </div>

      <ul className="rounded-md border bg-card divide-y">
        {items.length === 0 ? (
          <li className="px-4 py-3 text-sm text-muted-foreground">
            No onboarding items yet — click &ldquo;Spawn default checklist&rdquo; or add one below.
          </li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="px-4 py-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-[200px]">
                  <div className="font-medium text-sm">{item.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.type.replace(/_/g, " ")}
                  </div>
                </div>
                <StatusBadge status={item.status} />
                <form action={updateOnboardingItemAction} className="flex items-center gap-1">
                  <input type="hidden" name="id" value={item.id} />
                  <Select name="status" defaultValue={item.status}>
                    <SelectTrigger className="h-8 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ONBOARDING_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="submit" variant="ghost" size="sm">
                    Save
                  </Button>
                </form>
                <form action={deleteOnboardingItemAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="customerId" value={customerId} />
                  <Button type="submit" variant="ghost" size="sm">
                    Remove
                  </Button>
                </form>
              </div>
              {item.prompt ? (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">View prompt</summary>
                  <pre className="mt-2 whitespace-pre-wrap rounded bg-muted p-2 font-mono">
                    {item.prompt}
                  </pre>
                </details>
              ) : null}
              {item.notes ? (
                <div className="text-xs text-muted-foreground">{item.notes}</div>
              ) : null}
            </li>
          ))
        )}
      </ul>

      <div className="rounded-md border bg-card p-4 max-w-3xl">
        <h3 className="text-sm font-medium mb-3">Add an onboarding item</h3>
        <form action={formAction} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input type="hidden" name="customerId" value={customerId} />
          <div>
            <Label htmlFor="type">Type</Label>
            <Select name="type" defaultValue="OTHER">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ONBOARDING_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue="TODO">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ONBOARDING_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="prompt">Prompt / brief</Label>
            <Textarea id="prompt" name="prompt" rows={4} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="notes">Internal notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          {state?.ok === false ? (
            <div className="md:col-span-2">
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            </div>
          ) : null}
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Adding..." : "Add item"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
