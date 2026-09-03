"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface AiDialogTriggerProps {
  containerRef: React.RefObject<HTMLElement | null>;
  onGenerateDiagram: () => void;
  onModifySelection: () => void;
}

// Excalidraw's own library-toggle button (`.default-sidebar-trigger`) sits
// in a flex row (`.layer-ui__wrapper__top-right`) that can reflow, so its
// position isn't a fixed pixel constant we can hardcode — measure it at
// runtime instead. Recomputed on mount and on resize; if the element isn't
// found (e.g. a future Excalidraw version renames/removes the class), the
// button doesn't render rather than rendering at a wrong, misleading spot.
function useSidebarTriggerPosition(containerRef: React.RefObject<HTMLElement | null>) {
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    function measure() {
      const container = containerRef.current;
      if (!container) return;
      const trigger = container.querySelector(".default-sidebar-trigger");
      if (!trigger) {
        setPosition(null);
        return;
      }
      const rect = trigger.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setPosition({
        // 0.5rem gap below the library toggle, matching this app's other
        // small inter-control gaps (e.g. the header's gap-2).
        top: rect.bottom - containerRect.top + 8,
        right: containerRect.right - rect.right,
      });
    }

    measure();
    window.addEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, [containerRef]);

  return position;
}

export function AiDialogTrigger({ containerRef, onGenerateDiagram, onModifySelection }: AiDialogTriggerProps) {
  const position = useSidebarTriggerPosition(containerRef);

  if (!position) return null;

  return (
    <div
      className="absolute z-10"
      style={{ top: position.top, right: position.right }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" size="icon" aria-label="AI tools" />}
        >
          <Sparkles className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onGenerateDiagram}>Generate diagram</DropdownMenuItem>
          <DropdownMenuItem onClick={onModifySelection}>Modify selection</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
