import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center rounded-md border border-dashed p-10">
      {Icon ? <Icon className="h-8 w-8 text-muted-foreground mb-3" /> : null}
      <h3 className="text-base font-medium">{title}</h3>
      {description ? (
        <p className="text-sm text-muted-foreground mt-1 max-w-prose">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
