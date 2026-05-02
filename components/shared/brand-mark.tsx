import Image from "next/image";
import { cn } from "@/lib/utils";

// Two new transparent logo assets live in /public:
//   /tlmlogo-mark.png  — icon-only, used in compact spots (sidebar, favicons)
//   /tlmlogo-full.png  — icon + wordmark, used in marketing/header surfaces
// `variant="mark"` (default) is what the sidebar & topbar use. `variant="full"`
// is for the login screen and any bigger hero placement that wants the
// full Trade Leads lockup baked into the PNG.
export function BrandMark({
  size = 32,
  showWordmark = true,
  wordmark = "Trade Leads",
  className,
  wordmarkClass,
  variant = "mark",
}: {
  size?: number;
  showWordmark?: boolean;
  wordmark?: string;
  className?: string;
  wordmarkClass?: string;
  variant?: "mark" | "full";
}) {
  const src = variant === "full" ? "/tlmlogo-full.png" : "/tlmlogo-mark.png";
  // The "full" PNG already contains the wordmark, so we never render a text
  // wordmark next to it — that would double up.
  const renderWordmark = showWordmark && variant === "mark";
  // Aspect of the full lockup is roughly 3.4:1; mark is square.
  const width = variant === "full" ? Math.round(size * 3.4) : size;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src={src}
        alt="Trade Leads"
        width={width}
        height={size}
        priority
        className={variant === "mark" ? "rounded-md" : undefined}
      />
      {renderWordmark ? (
        <span
          className={cn(
            "font-display text-base font-bold tracking-tight",
            wordmarkClass,
          )}
        >
          {wordmark}
        </span>
      ) : null}
    </div>
  );
}
