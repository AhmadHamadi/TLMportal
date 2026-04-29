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
  CONTRACT_STATUSES,
  CONTRACT_TYPES,
} from "@/schemas/contracts";
import {
  createContractAction,
  deleteContractAction,
  updateContractStatusAction,
  type ActionResult,
} from "@/server/actions/contracts";
import { ExternalLink } from "lucide-react";

type Contract = {
  id: string;
  type: string;
  name: string;
  fileUrl: string;
  status: string;
  signedAt: Date | null;
  signerName: string | null;
  signerEmail: string | null;
  notes: string | null;
  createdAt: Date;
};

export function ContractsTab({
  customerId,
  contracts,
}: {
  customerId: string;
  contracts: Contract[];
}) {
  const [state, formAction, pending] = useActionState<ActionResult | undefined, FormData>(
    createContractAction,
    undefined,
  );

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card divide-y">
        {contracts.length === 0 ? (
          <div className="px-4 py-3 text-sm text-muted-foreground">
            No contracts yet. Add the master service agreement and a SOW per service below.
          </div>
        ) : (
          contracts.map((c) => (
            <div key={c.id} className="px-4 py-3 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[220px]">
                <div className="font-medium text-sm">{c.name}</div>
                <div className="text-xs text-muted-foreground">
                  {c.type.replace(/_/g, " ")}
                  {c.signerName ? ` · ${c.signerName}` : ""}
                  {c.signerEmail ? ` · ${c.signerEmail}` : ""}
                </div>
              </div>
              <StatusBadge status={c.status} />
              <a
                href={c.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Download
              </a>
              <form action={updateContractStatusAction} className="flex items-center gap-1">
                <input type="hidden" name="id" value={c.id} />
                <Select name="status" defaultValue={c.status}>
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" variant="ghost" size="sm">
                  Save
                </Button>
              </form>
              <form action={deleteContractAction}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="customerId" value={customerId} />
                <Button type="submit" variant="ghost" size="sm">
                  Remove
                </Button>
              </form>
            </div>
          ))
        )}
      </div>

      <div className="rounded-md border bg-card p-4 max-w-3xl">
        <h3 className="text-sm font-medium mb-3">Add a contract</h3>
        <form action={formAction} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input type="hidden" name="customerId" value={customerId} />
          <div>
            <Label htmlFor="type">Type</Label>
            <Select name="type" defaultValue="MASTER_SERVICE_AGREEMENT">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue="SENT">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required placeholder="MSA — Atlas Concrete (2026-04)" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="fileUrl">File URL (Drive / Dropbox / S3)</Label>
            <Input id="fileUrl" name="fileUrl" type="url" required placeholder="https://..." />
          </div>
          <div>
            <Label htmlFor="signerName">Signer name</Label>
            <Input id="signerName" name="signerName" />
          </div>
          <div>
            <Label htmlFor="signerEmail">Signer email</Label>
            <Input id="signerEmail" name="signerEmail" type="email" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
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
              {pending ? "Adding..." : "Add contract"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
