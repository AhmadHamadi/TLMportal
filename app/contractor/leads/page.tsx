import Link from "next/link";
import { listLeads } from "@/server/services/leads";
import { requireContractor } from "@/lib/auth-guard";
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
import { Inbox } from "lucide-react";
import { LeadFilters } from "@/components/leads/lead-filters";

export const metadata = { title: "Leads — TLM Portal" };

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ContractorLeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const ctx = await requireContractor();
  const sp = await searchParams;
  const flatSp: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(sp)) flatSp[k] = Array.isArray(v) ? v[0] : v;

  const filter = leadFilterSchema.parse({
    source: flatSp.source || undefined,
    status: flatSp.status || undefined,
    billableStatus: flatSp.billableStatus || undefined,
    q: flatSp.q || undefined,
    page: flatSp.page ?? "1",
  });
  const { items, total } = await listLeads(ctx, filter);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your leads</h1>
        <p className="text-sm text-muted-foreground">{total} total.</p>
      </div>

      <LeadFilters customers={[]} initial={filter} hideCustomer />

      {items.length === 0 ? (
        <EmptyState icon={Inbox} title="No leads match your filters" />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
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
                      href={`/contractor/leads/${lead.id}`}
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
      )}
    </div>
  );
}
