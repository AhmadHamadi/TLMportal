import Link from "next/link";
import { auth } from "@/auth";
import { logoutAction } from "@/server/actions/auth";
import { LayoutDashboard, ShieldAlert, Settings, LogOut } from "lucide-react";

export const metadata = { title: "More - TLM Portal" };

export default async function ContractorMorePage() {
  const session = await auth();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">More</h1>
      </div>
      <ul className="rounded-lg border bg-card divide-y">
        <li>
          <Link
            href="/contractor"
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-accent"
          >
            <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Overview</span>
          </Link>
        </li>
        <li>
          <Link
            href="/contractor/disputes"
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-accent"
          >
            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Disputes</span>
          </Link>
        </li>
        <li>
          <Link
            href="/contractor/settings"
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-accent"
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </li>
      </ul>
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Signed in as {session?.user.name ?? session?.user.email}.
      </div>
      <form action={logoutAction}>
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-2 rounded-md border py-3 text-sm font-medium hover:bg-muted"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </form>
    </div>
  );
}

