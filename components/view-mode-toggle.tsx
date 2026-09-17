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
    <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Grid view"
        aria-pressed={view === "grid"}
        onClick={() => onChange("grid")}
        className={cn(
          "text-muted-foreground hover:text-foreground",
          view === "grid" && "bg-background text-foreground shadow-xs hover:bg-background"
        )}
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
        className={cn(
          "text-muted-foreground hover:text-foreground",
          view === "list" && "bg-background text-foreground shadow-xs hover:bg-background"
        )}
      >
        <List className="size-4" />
      </Button>
    </div>
  );
}
