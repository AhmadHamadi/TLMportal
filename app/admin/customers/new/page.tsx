import { CustomerForm } from "@/components/customers/customer-form";
import { requireAdmin } from "@/lib/auth-guard";

export const metadata = { title: "New customer — Admin" };

export default async function NewCustomerPage() {
  await requireAdmin();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New customer</h1>
        <p className="text-sm text-muted-foreground">Set up a contractor customer.</p>
      </div>
      <CustomerForm />
    </div>
  );
}
