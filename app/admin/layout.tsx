import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/shell/app-shell";
import type { NavItem } from "@/components/shell/sidebar";

const NAV: NavItem[] = [
  { href: "/admin", label: "Overview", iconKey: "overview" },
  { href: "/admin/customers", label: "Customers", iconKey: "customers" },
  { href: "/admin/leads", label: "Leads", iconKey: "leads" },
  { href: "/admin/calls", label: "Calls", iconKey: "calls" },
  { href: "/admin/sms", label: "SMS", iconKey: "sms" },
  { href: "/admin/appointments", label: "Appointments", iconKey: "appointments" },
  { href: "/admin/billing", label: "Billing", iconKey: "billing" },
  { href: "/admin/disputes", label: "Disputes", iconKey: "disputes" },
  { href: "/admin/tracking-numbers", label: "Tracking numbers", iconKey: "numbers" },
  { href: "/admin/ad-spend", label: "Ad spend", iconKey: "spend" },
  { href: "/admin/automation", label: "Automation", iconKey: "automation" },
  { href: "/admin/settings", label: "Settings", iconKey: "settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  return (
    <AppShell
      navItems={NAV}
      brand="TLM Admin"
      email={session.user.email}
      name={session.user.name}
      role="ADMIN"
    >
      {children}
    </AppShell>
  );
}
