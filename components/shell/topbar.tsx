"use client";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/server/actions/auth";
import { LogOut, User } from "lucide-react";

export function Topbar({
  email,
  name,
  role,
}: {
  email: string;
  name: string | null | undefined;
  role: "ADMIN" | "CONTRACTOR";
}) {
  return (
    <header className="flex items-center justify-between border-b bg-card px-4 py-2.5 md:px-6">
      <div className="text-sm text-muted-foreground">
        {role === "ADMIN" ? "Agency operations" : "Your dashboard"}
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
