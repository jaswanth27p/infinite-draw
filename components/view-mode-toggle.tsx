"use client";

import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/hooks/use-view-mode";

interface ViewModeToggleProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}

export function ViewModeToggle({ view, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Grid view"
        aria-pressed={view === "grid"}
        onClick={() => onChange("grid")}
        className={cn(view === "grid" && "bg-accent text-accent-foreground")}
      >
        <LayoutGrid className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="List view"
        aria-pressed={view === "list"}
        onClick={() => onChange("list")}
        className={cn(view === "list" && "bg-accent text-accent-foreground")}
      >
        <List className="size-4" />
      </Button>
    </div>
  );
}
