import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({
  size = 32,
  showWordmark = true,
  wordmark = "TLM Portal",
  className,
  wordmarkClass,
}: {
  size?: number;
  showWordmark?: boolean;
  wordmark?: string;
  className?: string;
  wordmarkClass?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/tlmlogo.png"
        alt="Trade Leads Marketing"
        width={size}
        height={size}
        priority
        className="rounded-md"
      />
      {showWordmark ? (
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
