import { notFound } from "next/navigation";
import { getLead } from "@/server/services/leads";
import { requireAdmin } from "@/lib/auth-guard";
import { LeadDetail } from "@/components/leads/lead-detail";

export default async function AdminLeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const ctx = await requireAdmin();
  const lead = await getLead(ctx, leadId);
  if (!lead) notFound();
  return <LeadDetail lead={lead} viewerRole="ADMIN" />;
}
