"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import type { HostedFilesMap } from "@/lib/persist-canvas-files";

export interface FileRecord {
  id: string;
  name: string;
  currentData: {
    elements: unknown[];
    appState: Record<string, unknown>;
    files?: HostedFilesMap;
  };
  thumbnailUrl: string | null;
  thumbnailUrlDark: string | null;
  updatedAt: string;
  role: "OWNER" | "EDITOR" | "COMMENTER" | "VIEWER";
  generalAccess: "RESTRICTED" | "ANYONE";
  generalAccessRole: "VIEWER" | "COMMENTER" | "EDITOR" | null;
  owner: { id: string; name: string | null; email: string } | null;
}

export function useFileQuery(fileId: string) {
  const apiClient = useApiClient();

  return useQuery<FileRecord>({
    queryKey: ["file", fileId],
    queryFn: () => apiClient(`/files/${fileId}`),
    retry: false,
  });
}
