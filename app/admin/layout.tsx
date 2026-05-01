import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/shell/app-shell";
import type { NavGroup } from "@/components/shell/sidebar";

// Admin nav is customer-centric. Global activity feeds (leads / calls / SMS /
// appointments) are accessible from each customer's detail page rather than
// surfaced in the top nav, so the agency operator stays focused on per-client
// work and isn't drowned in a global firehose.
const NAV: NavGroup[] = [
  {
    label: "Dashboard",
    items: [
      { href: "/admin", label: "Overview", iconKey: "overview" },
      { href: "/admin/customers", label: "Customers", iconKey: "customers" },
    ],
  },
  {
    label: "Integrations",
    items: [
      { href: "/admin/twilio", label: "Twilio", iconKey: "calls" },
      { href: "/admin/google-ads", label: "Google Ads", iconKey: "spend" },
      { href: "/admin/google-business-profile", label: "Business Profile", iconKey: "gbp" },
      { href: "/admin/google-search-console", label: "Search Console", iconKey: "search" },
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
