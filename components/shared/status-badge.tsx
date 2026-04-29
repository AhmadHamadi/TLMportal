import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const POSITIVE = new Set([
  "ACTIVE",
  "WON",
  "BILLABLE",
  "PAID",
  "ACCEPTED",
  "ACCEPTED_BY_CONTRACTOR",
  "APPROVED",
  "CONFIRMED",
  "COMPLETED",
  "QUOTED",
]);

const WARN = new Set([
  "PENDING",
  "PAUSED",
  "WINTER_MODE",
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "APPOINTMENT_REQUESTED",
  "REQUESTED",
  "SENT_TO_CONTRACTOR",
  "OPEN",
  "INVOICED",
]);

const DANGER = new Set([
  "CANCELLED",
  "DECLINED",
  "DECLINED_BY_CONTRACTOR",
  "DISPUTED",
  "LOST",
  "NOT_BILLABLE",
  "REJECTED",
  "VOID",
  "NO_SHOW",
  "FAILED",
  "SPAM",
  "RELEASED",
  "INACTIVE",
]);

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const variant = POSITIVE.has(status)
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
    : DANGER.has(status)
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
      : WARN.has(status)
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
        : "";
  return (
    <Badge variant="outline" className={cn(variant, className)}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
