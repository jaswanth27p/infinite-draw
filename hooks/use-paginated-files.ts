"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/lib/file-types";

export function usePaginatedFiles<T>(endpoint: string, limit = 30, q?: string) {
  const apiClient = useApiClient();

  return useInfiniteQuery({
    queryKey: ["file-list", endpoint, limit, q],
    queryFn: ({ pageParam }: { pageParam: string | null }) => {
      const cursorParam = pageParam ? `&cursor=${pageParam}` : "";
      const qParam = q ? `&q=${encodeURIComponent(q)}` : "";
      return apiClient(`${endpoint}?limit=${limit}${cursorParam}${qParam}`) as Promise<
        PaginatedResponse<T>
      >;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
