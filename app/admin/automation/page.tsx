import { listRules } from "@/server/services/automation";
import { listCustomers } from "@/server/services/customers";
import { requireAdmin } from "@/lib/auth-guard";
import { Button } from "@/components/ui/button";
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
import { Zap } from "lucide-react";
import { CreateRuleForm } from "@/components/automation/create-rule-form";
import { toggleRuleAction, deleteRuleAction } from "@/server/actions/automation";

export const metadata = { title: "Automation — Admin" };

export default async function AutomationPage() {
  const ctx = await requireAdmin();
  const [rules, customers] = await Promise.all([listRules(ctx), listCustomers(ctx)]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Automation</h1>
        <p className="text-sm text-muted-foreground">
          Per-customer rules that fire on trigger events. SMS templates may use{" "}
          <code>{"{{firstName}}"}</code>, <code>{"{{service}}"}</code>,{" "}
          <code>{"{{city}}"}</code>, <code>{"{{preferredTime}}"}</code>,{" "}
          <code>{"{{projectDetails}}"}</code>. No prices, discounts, warranties.
        </p>
      </div>

      {rules.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No automation rules yet"
          description="Create one below."
        />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{r.customer.businessName}</TableCell>
                  <TableCell className="text-sm font-medium">{r.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.trigger.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.isActive ? "ACTIVE" : "INACTIVE"} />
                  </TableCell>
                  <TableCell className="space-x-2">
                    <form action={toggleRuleAction} className="inline">
                      <input type="hidden" name="id" value={r.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        {r.isActive ? "Disable" : "Enable"}
                      </Button>
                    </form>
                    <form action={deleteRuleAction} className="inline">
                      <input type="hidden" name="id" value={r.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Delete
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="rounded-md border bg-card p-4 max-w-3xl">
        <h2 className="text-sm font-medium mb-3">New rule</h2>
        <CreateRuleForm customers={customers.map((c) => ({ id: c.id, businessName: c.businessName }))} />
      </div>
    </div>
  );
}
