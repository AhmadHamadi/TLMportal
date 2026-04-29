"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  LEAD_SOURCE_VALUES,
  LEAD_STATUS_VALUES,
  BILLABLE_STATUS_VALUES,
  type LeadFilterInput,
} from "@/schemas/lead";

const ALL = "__all__";

export function LeadFilters({
  customers,
  initial,
  hideCustomer = false,
}: {
  customers: { id: string; businessName: string }[];
  initial: LeadFilterInput;
  hideCustomer?: boolean;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();

  function setParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(sp.toString());
    if (!value || value === ALL) params.delete(key);
    else params.set(key, value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        defaultValue={initial.q ?? ""}
        placeholder="Search name, phone, email, city, service..."
        className="max-w-xs"
        onKeyDown={(e) => {
          if (e.key === "Enter") setParam("q", (e.target as HTMLInputElement).value);
        }}
      />
      {!hideCustomer ? (
        <Select
          value={initial.customerId ?? ALL}
          onValueChange={(v) => setParam("customerId", v ?? undefined)}
        >
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Customer" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All customers</SelectItem>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.businessName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <Select value={initial.source ?? ALL} onValueChange={(v) => setParam("source", v ?? undefined)}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Source" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All sources</SelectItem>
          {LEAD_SOURCE_VALUES.map((s) => (
            <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={initial.status ?? ALL} onValueChange={(v) => setParam("status", v ?? undefined)}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {LEAD_STATUS_VALUES.map((s) => (
            <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={initial.billableStatus ?? ALL}
        onValueChange={(v) => setParam("billableStatus", v ?? undefined)}
      >
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Billable" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Any</SelectItem>
          {BILLABLE_STATUS_VALUES.map((s) => (
            <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(pathname)}
        type="button"
      >
        Clear
      </Button>
    </div>
  );
}
