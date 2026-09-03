"use client";

import { useEffect, useMemo, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { UseInfiniteQueryResult, InfiniteData } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { useViewMode } from "@/hooks/use-view-mode";
import { ViewModeToggle } from "@/components/view-mode-toggle";
import { EmptyState } from "@/components/empty-state";
import { FileGridSkeleton } from "@/components/file-grid-skeleton";
import { FileGridError } from "@/components/file-grid-error";
import type { PaginatedResponse } from "@/lib/file-types";

const GRID_ROW_HEIGHT = 220;
const LIST_ROW_HEIGHT = 64;

function useColumnCount(el: HTMLDivElement | null) {
  const [columns, setColumns] = useState(2);

  useEffect(() => {
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setColumns(width >= 1024 ? 4 : width >= 640 ? 3 : 2);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [el]);

  return columns;
}

interface VirtualizedFileListProps<T extends { id: string }> {
  query: UseInfiniteQueryResult<InfiniteData<PaginatedResponse<T>>, Error>;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  errorMessage: string;
  renderCard: (item: T, view: "grid" | "list") => React.ReactNode;
  showViewToggle?: boolean;
}

export function VirtualizedFileList<T extends { id: string }>({
  query,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  errorMessage,
  renderCard,
  showViewToggle = true,
}: VirtualizedFileListProps<T>) {
  const [storedView, setView] = useViewMode();
  const view = showViewToggle ? storedView : "grid";
  const [parentEl, setParentEl] = useState<HTMLDivElement | null>(null);
  const columns = useColumnCount(parentEl);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, isError, error, refetch } = query;

  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const effectiveColumns = view === "grid" ? columns : 1;
  const rowCount = Math.ceil(items.length / effectiveColumns) + (hasNextPage ? 1 : 0);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentEl,
    estimateSize: () => (view === "grid" ? GRID_ROW_HEIGHT : LIST_ROW_HEIGHT),
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  useEffect(() => {
    const lastItem = virtualItems.at(-1);
    if (!lastItem) return;
    if (lastItem.index >= rowCount - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [virtualItems, rowCount, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isPending) {
    return <FileGridSkeleton />;
  }

  if (isError) {
    return <FileGridError error={error} reset={() => refetch()} message={errorMessage} />;
  }

  if (items.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {showViewToggle && (
        <div className="flex justify-end">
          <ViewModeToggle view={storedView} onChange={setView} />
        </div>
      )}
      {/* overflow-y-auto forces overflow-x to clip too (CSS spec), which cuts
          off card hover shadows at the row/column edges. -mx-2 px-2 gives
          the shadow room without shifting the grid's visible layout. */}
      <div ref={setParentEl} className="-mx-2 h-[calc(100vh-14rem)] overflow-y-auto px-2 pt-2 pb-2">
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualItems.map((virtualRow) => {
            const rowItems = items.slice(
              virtualRow.index * effectiveColumns,
              virtualRow.index * effectiveColumns + effectiveColumns,
            );
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                  ...(view === "grid"
                    ? { display: "grid", gap: "1rem", gridTemplateColumns: `repeat(${effectiveColumns}, minmax(0, 1fr))` }
                    : {}),
                }}
                className={view === "list" ? "flex flex-col gap-2" : undefined}
              >
                {rowItems.length > 0
                  ? rowItems.map((item) => <div key={item.id}>{renderCard(item, view)}</div>)
                  : isFetchingNextPage && <FileGridSkeleton />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
