"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";

export interface FileRecord {
  id: string;
  name: string;
  currentData: { elements: unknown[]; appState: Record<string, unknown> };
  thumbnailUrl: string | null;
  updatedAt: string;
}

export function useFileQuery(fileId: string) {
  const apiClient = useApiClient();

  return useQuery<FileRecord>({
    queryKey: ["file", fileId],
    queryFn: () => apiClient(`/files/${fileId}`),
    retry: false,
  });
}
