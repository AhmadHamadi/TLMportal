import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listCustomers } from "@/server/services/customers";
import { requireAdmin } from "@/lib/auth-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatMoney } from "@/lib/money";
import { formatNational } from "@/lib/phone";
import { EmptyState } from "@/components/shared/empty-state";
import { Users, Plus } from "lucide-react";

export const metadata = { title: "Customers — Admin" };

export default async function CustomersPage() {
  const ctx = await requireAdmin();
  const customers = await listCustomers(ctx);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            All contractor customers and their billing config.
          </p>
        </div>
        <Link href="/admin/customers/new" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />
          New customer
        </Link>
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Add your first contractor customer to start tracking leads."
          action={
            <Link href="/admin/customers/new" className={buttonVariants()}>
              Add customer
            </Link>
          }
        />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Retainer</TableHead>
                <TableHead className="text-right">Appt fee</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.businessName}</TableCell>
                  <TableCell>
                    <div>{c.contactName}</div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </TableCell>
                  <TableCell>{formatNational(c.phone)}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell className="text-right">{formatMoney(c.monthlyRetainer)}</TableCell>
                  <TableCell className="text-right">{formatMoney(c.appointmentFee)}</TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/customers/${c.id}`}
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
