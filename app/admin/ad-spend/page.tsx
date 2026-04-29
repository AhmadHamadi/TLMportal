import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { listCustomers } from "@/server/services/customers";
import { Button } from "@/components/ui/button";
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
import { AdSpendForm } from "@/components/ad-spend/ad-spend-form";
import { deleteAdSpendAction } from "@/server/actions/ad-spend";

export const metadata = { title: "Ad spend — Admin" };

export default async function AdSpendPage() {
  const ctx = await requireAdmin();
  const [spend, customers] = await Promise.all([
    db.googleAdsSpend.findMany({
      orderBy: [{ month: "desc" }, { customerId: "asc" }],
      include: { customer: { select: { businessName: true } } },
    }),
    listCustomers(ctx),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Google Ads spend</h1>
        <p className="text-sm text-muted-foreground">
          Manual entry now (one row per customer + month). Google Ads API integration is Phase 9b.
        </p>
      </div>

      {spend.length === 0 ? (
        <EmptyState icon={LineChart} title="No ad spend recorded yet" />
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
                <TableHead className="text-right">Conv.</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead></TableHead>
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
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {s.notes ?? ""}
                  </TableCell>
                  <TableCell>
                    <form action={deleteAdSpendAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Remove
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="rounded-md border bg-card p-4 max-w-3xl space-y-3">
        <h2 className="text-sm font-medium">Add or update a month</h2>
        <AdSpendForm customers={customers.map((c) => ({ id: c.id, businessName: c.businessName }))} />
      </div>
    </div>
  );
}
