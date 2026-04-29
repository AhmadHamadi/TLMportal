import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { EmptyState } from "@/components/shared/empty-state";
import { MessageSquare } from "lucide-react";
import { formatDateTime } from "@/lib/dates";

export const metadata = { title: "SMS — Admin" };

export default async function AdminSmsPage() {
  await requireAdmin();
  const messages = await db.smsMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { customer: { select: { businessName: true } } },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">SMS inbox</h1>
        <p className="text-sm text-muted-foreground">
          Twilio SMS log. Live integration ships in Phase 6.
        </p>
      </div>
      {messages.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No SMS yet"
          description="Inbound and outbound messages will appear here once Twilio webhooks are wired."
        />
      ) : (
        <ul className="space-y-2">
          {messages.map((m) => (
            <li key={m.id} className="rounded-md border bg-card p-3 text-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {m.direction} · {m.customer.businessName} · {m.fromNumber} → {m.toNumber}
                </span>
                <span>{formatDateTime(m.createdAt)}</span>
              </div>
              <div className="mt-1">{m.body}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
