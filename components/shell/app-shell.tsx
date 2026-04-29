import { Sidebar, type NavGroup, type NavItem } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";

export function AppShell({
  children,
  navItems,
  navGroups,
  brand,
  email,
  name,
  role,
}: {
  children: React.ReactNode;
  navItems?: NavItem[];
  navGroups?: NavGroup[];
  brand: string;
  email: string;
  name: string | null | undefined;
  role: "ADMIN" | "CONTRACTOR";
}) {
  return (
    <div className="flex min-h-svh">
      <Sidebar items={navItems} groups={navGroups} brand={brand} />
      <div className="flex flex-1 flex-col">
        <Topbar email={email} name={name} role={role} />
        <main className="flex-1 overflow-x-auto p-4 md:p-6 bg-background">{children}</main>
      </div>
    </div>
  );
}
