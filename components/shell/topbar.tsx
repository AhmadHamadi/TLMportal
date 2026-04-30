"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/server/actions/auth";
import { ICONS, type NavGroup, type NavItem } from "@/components/shell/sidebar";
import { LogOut, Menu, User } from "lucide-react";

export function Topbar({
  email,
  name,
  role,
  navItems,
  navGroups,
  brand,
}: {
  email: string;
  name: string | null | undefined;
  role: "ADMIN" | "CONTRACTOR";
  navItems?: NavItem[];
  navGroups?: NavGroup[];
  brand?: string;
}) {
  const resolvedGroups: NavGroup[] = navGroups ?? (navItems ? [{ items: navItems }] : []);
  const showMobileMenu = role === "ADMIN" && resolvedGroups.length > 0;

  return (
    <header className="flex items-center justify-between border-b bg-card px-4 py-2.5 md:px-6">
      <div className="flex items-center gap-2">
        {showMobileMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 items-center gap-2 rounded-md border px-2 text-sm font-medium hover:bg-accent md:hidden">
              <Menu className="h-4 w-4" />
              Menu
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              <DropdownMenuLabel>{brand ?? "Admin"} menu</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[70vh] space-y-3 overflow-y-auto p-1">
                {resolvedGroups.map((group, index) => (
                  <div key={group.label ?? index}>
                    {group.label ? (
                      <div className="px-1.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {group.label}
                      </div>
                    ) : null}
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = ICONS[item.iconKey];
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent"
                          >
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        <div className="text-sm text-muted-foreground">
          {role === "ADMIN" ? "Agency operations" : "Your dashboard"}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge
          className={
            role === "ADMIN"
              ? "bg-[#F37021] text-white border-transparent hover:bg-[#D85A0F]"
              : "bg-[#EAF1FE] text-[#143E96] border-transparent"
          }
        >
          {role}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium hover:bg-accent">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">{name ?? email}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <form action={logoutAction} className="px-1 py-1">
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
