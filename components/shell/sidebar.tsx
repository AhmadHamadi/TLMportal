"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/shared/brand-mark";
import {
  LayoutDashboard,
  Users,
  Inbox,
  Phone,
  MessageSquare,
  CalendarCheck,
  Receipt,
  ShieldAlert,
  Hash,
  LineChart,
  Settings,
  Zap,
  FileText,
  Sparkles,
  FileSignature,
  BookOpen,
} from "lucide-react";

export const ICONS = {
  overview: LayoutDashboard,
  customers: Users,
  leads: Inbox,
  calls: Phone,
  sms: MessageSquare,
  appointments: CalendarCheck,
  billing: Receipt,
  disputes: ShieldAlert,
  numbers: Hash,
  spend: LineChart,
  settings: Settings,
  automation: Zap,
  reports: FileText,
  ai: Sparkles,
  contracts: FileSignature,
  prompts: BookOpen,
} as const;

export type IconKey = keyof typeof ICONS;

export type NavItem = {
  href: string;
  label: string;
  iconKey: IconKey;
};

export type NavGroup = {
  label?: string;
  items: NavItem[];
};

export function Sidebar({
  items,
  groups,
  brand,
}: {
  items?: NavItem[];
  groups?: NavGroup[];
  brand: string;
}) {
  const pathname = usePathname();
  const resolved: NavGroup[] = groups ?? (items ? [{ items }] : []);

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-4 py-5 border-b border-sidebar-border">
        <Link href="/" className="block">
          <BrandMark size={28} wordmark={brand} wordmarkClass="text-white" />
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {resolved.map((group, gi) => (
          <div key={gi} className={cn(gi > 0 && "mt-4")}>
            {group.label ? (
              <div className="px-4 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/45">
                {group.label}
              </div>
            ) : null}
            <ul className="space-y-0.5 px-2">
              {group.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = ICONS[item.iconKey];
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="px-4 py-3 text-[11px] text-sidebar-foreground/45 border-t border-sidebar-border">
        Trade Leads Marketing
      </div>
    </aside>
  );
}
