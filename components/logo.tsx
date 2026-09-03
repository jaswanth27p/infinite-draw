import { Infinity as InfinityMark } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ iconOnly = false, className }: { iconOnly?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <InfinityMark className="size-4" strokeWidth={2.5} />
      </span>
      {!iconOnly && <span className="font-semibold tracking-tight">infinite-draw</span>}
    </span>
  );
}
