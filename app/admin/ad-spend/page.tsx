import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { LineChart } from "lucide-react";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Ad spend — Admin" };

export default async function AdSpendPage() {
  await requireAdmin();
  const spend = await db.googleAdsSpend.findMany({
    orderBy: [{ month: "desc" }, { customerId: "asc" }],
    include: { customer: { select: { businessName: true } } },
  });
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Google Ads spend</h1>
        <p className="text-sm text-muted-foreground">
          Manual entry now; Google Ads API integration is Phase 9.
        </p>
      </div>
      {spend.length === 0 ? (
        <EmptyState icon={LineChart} title="No ad spend recorded" />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">Conversions</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {spend.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-sm">{s.month}</TableCell>
                  <TableCell className="text-sm">{s.customer.businessName}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(s.spendAmount)}
                  </TableCell>
                  <TableCell className="text-right text-sm">{s.impressions ?? "—"}</TableCell>
                  <TableCell className="text-right text-sm">{s.clicks ?? "—"}</TableCell>
                  <TableCell className="text-right text-sm">{s.conversions ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.notes ?? ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
