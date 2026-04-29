import { listCustomers } from "@/server/services/customers";
import { requireAdmin } from "@/lib/auth-guard";
import { LeadCreateForm } from "@/components/leads/lead-create-form";

export const metadata = { title: "New lead — Admin" };

export default async function NewLeadPage() {
  const ctx = await requireAdmin();
  const customers = await listCustomers(ctx);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New lead</h1>
        <p className="text-sm text-muted-foreground">Manual entry from a phone call or referral.</p>
      </div>
      <LeadCreateForm customers={customers.map((c) => ({ id: c.id, businessName: c.businessName }))} />
    </div>
  );
}
