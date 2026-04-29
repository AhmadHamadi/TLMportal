import { listLeads } from "@/server/services/leads";
import { requireContractor } from "@/lib/auth-guard";
import { leadFilterSchema } from "@/schemas/lead";
import { EmptyState } from "@/components/shared/empty-state";
import { Inbox } from "lucide-react";
import { LeadCard } from "@/components/contractor/lead-card";

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
    status: flatSp.status || undefined,
    billableStatus: flatSp.billableStatus || undefined,
    page: flatSp.page ?? "1",
  });
  const { items, total } = await listLeads(ctx, filter);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Your leads</h1>
        <p className="text-sm text-muted-foreground">
          {total} total · tap a card to call, text, or update.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No leads yet"
          description="New leads from your tracking number, ads, and landing page show up here."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((lead) => (
            <li key={lead.id}>
              <LeadCard lead={lead} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
