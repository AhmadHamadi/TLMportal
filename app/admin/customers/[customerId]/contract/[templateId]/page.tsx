import { notFound } from "next/navigation";
import { getCustomerById } from "@/server/services/customers";
import { requireAdmin } from "@/lib/auth-guard";
import {
  CONTRACT_TEMPLATES,
  defaultFillVars,
  renderContract,
} from "@/lib/contract-templates";
import { ContractRender } from "@/components/contracts/contract-render";

export default async function FilledContractPage({
  params,
}: {
  params: Promise<{ customerId: string; templateId: string }>;
}) {
  const { customerId, templateId } = await params;
  const ctx = await requireAdmin();
  const customer = await getCustomerById(ctx, customerId);
  if (!customer) notFound();
  const template = CONTRACT_TEMPLATES.find((t) => t.id === templateId);
  if (!template) notFound();

  const vars = defaultFillVars({
    businessName: customer.businessName,
    contactName: customer.contactName,
    email: customer.email,
    phone: customer.phone,
    setupFee: customer.setupFee.toString(),
    monthlyRetainer: customer.monthlyRetainer.toString(),
    appointmentFee: customer.appointmentFee.toString(),
  });

  const filled = renderContract(template, vars);

  return <ContractRender title={filled.name} body={filled.body} customerName={customer.businessName} />;
}
