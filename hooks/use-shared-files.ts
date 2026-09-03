"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import type { PaginatedResponse, SharedFileListItem } from "@/lib/file-types";

export function useSharedFiles(q?: string, role?: "VIEWER" | "COMMENTER" | "EDITOR", limit = 30) {
  const apiClient = useApiClient();

  return useInfiniteQuery({
    queryKey: ["file-list", "/files/shared", limit, q, role],
    queryFn: ({ pageParam }: { pageParam: string | null }) => {
      const cursorParam = pageParam ? `&cursor=${pageParam}` : "";
      const qParam = q ? `&q=${encodeURIComponent(q)}` : "";
      const roleParam = role ? `&role=${role}` : "";
      return apiClient(`/files/shared?limit=${limit}${cursorParam}${qParam}${roleParam}`) as Promise<
        PaginatedResponse<SharedFileListItem>
      >;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
