import { notFound } from "next/navigation";
import { buildMonthlyReport } from "@/server/services/reports";
import { requireAdmin } from "@/lib/auth-guard";
import { ReportView } from "@/components/reports/report-view";

export default async function MonthlyReportPage({
  params,
}: {
  params: Promise<{ customerId: string; month: string }>;
}) {
  const { customerId, month } = await params;
  const ctx = await requireAdmin();
  let report;
  try {
    report = await buildMonthlyReport(ctx, { customerId, month });
  } catch {
    notFound();
  }
  return <ReportView report={report} />;
}
