import { Sidebar, type NavItem } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { BottomNav } from "@/components/shell/bottom-nav";

export function ContractorShell({
  children,
  navItems,
  brand,
  email,
  name,
}: {
  children: React.ReactNode;
  navItems: NavItem[];
  brand: string;
  email: string;
  name: string | null | undefined;
}) {
  return (
    <div className="flex min-h-svh">
      <Sidebar items={navItems} brand={brand} />
      <div className="flex flex-1 flex-col">
        <Topbar email={email} name={name} role="CONTRACTOR" />
        <main className="flex-1 overflow-x-auto p-4 md:p-6 bg-background pb-20 md:pb-6">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
