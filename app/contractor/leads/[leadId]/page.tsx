import { notFound } from "next/navigation";
import { getLead } from "@/server/services/leads";
import { ForbiddenError, requireContractor } from "@/lib/auth-guard";
import { LeadDetail } from "@/components/leads/lead-detail";

export default async function ContractorLeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const ctx = await requireContractor();
  let lead;
  try {
    lead = await getLead(ctx, leadId);
  } catch (err) {
    if (err instanceof ForbiddenError) notFound();
    throw err;
  }
  if (!lead) notFound();
  return <LeadDetail lead={lead} viewerRole="CONTRACTOR" />;
}
