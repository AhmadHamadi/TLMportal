import Link from "next/link";
import { listLeads } from "@/server/services/leads";
import { listCustomers } from "@/server/services/customers";
import { requireAdmin } from "@/lib/auth-guard";
import { leadFilterSchema } from "@/schemas/lead";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime } from "@/lib/dates";
import { formatNational } from "@/lib/phone";
import { Inbox, Plus } from "lucide-react";
import { LeadFilters } from "@/components/leads/lead-filters";

export const metadata = { title: "Leads — Admin" };

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const ctx = await requireAdmin();
  const sp = await searchParams;
  const flatSp: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(sp)) {
    flatSp[k] = Array.isArray(v) ? v[0] : v;
  }
  const filter = leadFilterSchema.parse({
    customerId: flatSp.customerId || undefined,
    source: flatSp.source || undefined,
    status: flatSp.status || undefined,
    billableStatus: flatSp.billableStatus || undefined,
    q: flatSp.q || undefined,
    page: flatSp.page ?? "1",
  });
  const [{ items, total, page, pageSize }, customers] = await Promise.all([
    listLeads(ctx, filter),
    listCustomers(ctx),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            All leads across all customers — {total} total.
          </p>
        </div>
        <Link href="/admin/leads/new" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />
          New lead
        </Link>
      </div>

      <LeadFilters customers={customers} initial={filter} />

      {items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No leads match your filters"
          description="Try clearing filters or adding a manual lead."
          action={
            <Link href="/admin/leads/new" className={buttonVariants()}>
              Add lead
            </Link>
          }
        />
      ) : (
        <>
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Billable</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">
                      {[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "—"}
                      <div className="text-xs text-muted-foreground">
                        {lead.phone ? formatNational(lead.phone) : ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{lead.customer.businessName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {lead.source.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="text-sm">{lead.serviceRequested ?? "—"}</TableCell>
                    <TableCell><StatusBadge status={lead.status} /></TableCell>
                    <TableCell><StatusBadge status={lead.billableStatus} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(lead.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                      >
                        Open
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 ? (
            <div className="flex items-center justify-end gap-2 text-sm">
              <span className="text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page > 1 ? (
                <Link
                  href={`?${new URLSearchParams({ ...flatSp as Record<string, string>, page: String(page - 1) })}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Previous
                </Link>
              ) : null}
              {page < totalPages ? (
                <Link
                  href={`?${new URLSearchParams({ ...flatSp as Record<string, string>, page: String(page + 1) })}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Next
                </Link>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
