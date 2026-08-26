"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { UseInfiniteQueryResult, InfiniteData } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { useViewMode } from "@/hooks/use-view-mode";
import { ViewModeToggle } from "@/components/view-mode-toggle";
import { EmptyState } from "@/components/empty-state";
import { FileGridSkeleton } from "@/components/file-grid-skeleton";
import type { PaginatedResponse } from "@/lib/file-types";

const GRID_ROW_HEIGHT = 220;
const LIST_ROW_HEIGHT = 64;

function useColumnCount(ref: React.RefObject<HTMLDivElement | null>) {
  const [columns, setColumns] = useState(2);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setColumns(width >= 1024 ? 4 : width >= 640 ? 3 : 2);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return columns;
}

interface VirtualizedFileListProps<T extends { id: string }> {
  query: UseInfiniteQueryResult<InfiniteData<PaginatedResponse<T>>, Error>;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  renderCard: (item: T, view: "grid" | "list") => React.ReactNode;
  showViewToggle?: boolean;
}

export function VirtualizedFileList<T extends { id: string }>({
  query,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  renderCard,
  showViewToggle = true,
}: VirtualizedFileListProps<T>) {
  const [storedView, setView] = useViewMode();
  const view = showViewToggle ? storedView : "grid";
  const parentRef = useRef<HTMLDivElement>(null);
  const columns = useColumnCount(parentRef);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } = query;

  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const effectiveColumns = view === "grid" ? columns : 1;
  const rowCount = Math.ceil(items.length / effectiveColumns) + (hasNextPage ? 1 : 0);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
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
      <div ref={parentRef} className="h-[calc(100vh-14rem)] overflow-y-auto">
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
                }}
                className={
                  view === "grid" ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" : "flex flex-col gap-2"
                }
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
