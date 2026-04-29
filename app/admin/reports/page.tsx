import Link from "next/link";
import { listCustomers } from "@/server/services/customers";
import { requireAdmin } from "@/lib/auth-guard";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { billingMonthKey } from "@/lib/dates";
import { FileText } from "lucide-react";

export const metadata = { title: "Reports — Admin" };

export default async function ReportsPage() {
  const ctx = await requireAdmin();
  const customers = await listCustomers(ctx);
  const month = billingMonthKey();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Branded monthly performance reports per customer. Print to PDF directly from the
          report page.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {customers.map((c) => (
          <Card key={c.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {c.businessName}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Latest: {month}</span>
              <Link
                href={`/admin/reports/${c.id}/${month}`}
                className={buttonVariants({ size: "sm" })}
              >
                Open report
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
