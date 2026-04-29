"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
} from "lucide-react";

const ICONS = {
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
} as const;

export type IconKey = keyof typeof ICONS;

export type NavItem = {
  href: string;
  label: string;
  iconKey: IconKey;
};

export function Sidebar({ items, brand }: { items: NavItem[]; brand: string }) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:bg-card">
      <div className="px-4 py-5 border-b">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {brand}
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          {items.map((item) => {
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
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
