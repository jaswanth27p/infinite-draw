"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import type { PaginatedResponse, FileListItem, SharedFileListItem } from "@/lib/file-types";

export function useSearchFiles(q: string, limit = 30) {
  const apiClient = useApiClient();

  return useInfiniteQuery({
    queryKey: ["file-list", "/files/search", limit, q],
    queryFn: ({ pageParam }: { pageParam: string | null }) => {
      const cursorParam = pageParam ? `&cursor=${pageParam}` : "";
      return apiClient(`/files/search?q=${encodeURIComponent(q)}&limit=${limit}${cursorParam}`) as Promise<
        PaginatedResponse<FileListItem | SharedFileListItem>
      >;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: q.length > 0,
  });
}
