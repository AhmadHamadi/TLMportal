import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ContractorShell } from "@/components/shell/contractor-shell";
import type { NavItem } from "@/components/shell/sidebar";

const NAV: NavItem[] = [
  { href: "/contractor", label: "Overview", iconKey: "overview" },
  { href: "/contractor/leads", label: "Leads", iconKey: "leads" },
  { href: "/contractor/appointments", label: "Appointments", iconKey: "appointments" },
  { href: "/contractor/billing", label: "Billing", iconKey: "billing" },
  { href: "/contractor/disputes", label: "Disputes", iconKey: "disputes" },
  { href: "/contractor/settings", label: "Settings", iconKey: "settings" },
];

export default async function ContractorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CONTRACTOR") redirect("/login");

  return (
    <ContractorShell
      navItems={NAV}
      brand="TLM Portal"
      email={session.user.email}
      name={session.user.name}
    >
      {children}
    </ContractorShell>
  );
}
