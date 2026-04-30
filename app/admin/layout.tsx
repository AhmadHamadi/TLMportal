import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/shell/app-shell";
import type { NavGroup } from "@/components/shell/sidebar";

const NAV: NavGroup[] = [
  {
    label: "Dashboard",
    items: [{ href: "/admin", label: "Overview", iconKey: "overview" }],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/customers", label: "Customers", iconKey: "customers" },
      { href: "/admin/leads", label: "Leads", iconKey: "leads" },
      { href: "/admin/appointments", label: "Appointments", iconKey: "appointments" },
      { href: "/admin/calls", label: "Calls", iconKey: "calls" },
      { href: "/admin/sms", label: "SMS", iconKey: "sms" },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/admin/reports", label: "Reports", iconKey: "reports" },
      { href: "/admin/automation", label: "Automation", iconKey: "automation" },
      { href: "/admin/prompts", label: "Prompt library", iconKey: "prompts" },
      { href: "/admin/contract-templates", label: "Contracts", iconKey: "contracts" },
    ],
  },
  {
    label: "Billing & infra",
    items: [
      { href: "/admin/billing", label: "Billing", iconKey: "billing" },
      { href: "/admin/ad-spend", label: "Ad spend", iconKey: "spend" },
      { href: "/admin/tracking-numbers", label: "Tracking numbers", iconKey: "numbers" },
    ],
  },
  {
    label: "System",
    items: [{ href: "/admin/settings", label: "Settings", iconKey: "settings" }],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  return (
    <AppShell
      navGroups={NAV}
      brand="TLM Admin"
      email={session.user.email}
      name={session.user.name}
      role="ADMIN"
    >
      {children}
    </AppShell>
  );
}
