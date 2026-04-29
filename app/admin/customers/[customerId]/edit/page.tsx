import { notFound } from "next/navigation";
import { CustomerForm } from "@/components/customers/customer-form";
import { getCustomerById } from "@/server/services/customers";
import { requireAdmin } from "@/lib/auth-guard";

export const metadata = { title: "Edit customer — Admin" };

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const ctx = await requireAdmin();
  const customer = await getCustomerById(ctx, customerId);
  if (!customer) notFound();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit {customer.businessName}
        </h1>
      </div>
      <CustomerForm
        customer={{
          id: customer.id,
          businessName: customer.businessName,
          contactName: customer.contactName,
          email: customer.email,
          phone: customer.phone,
          forwardingPhone: customer.forwardingPhone,
          websiteUrl: customer.websiteUrl,
          landingPageUrl: customer.landingPageUrl,
          googleAdsCustomerId: customer.googleAdsCustomerId,
          setupFee: customer.setupFee.toString(),
          monthlyRetainer: customer.monthlyRetainer.toString(),
          appointmentFee: customer.appointmentFee.toString(),
          monthlyAdBudget: customer.monthlyAdBudget.toString(),
          minProjectSize: customer.minProjectSize?.toString() ?? null,
          disputeWindowHours: customer.disputeWindowHours,
          status: customer.status,
          notes: customer.notes,
        }}
      />
    </div>
  );
}
