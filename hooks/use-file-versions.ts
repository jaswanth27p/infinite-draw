"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";

export interface FileVersion {
  id: string;
  name: string;
  origin: "MANUAL" | "AUTO";
  createdAt: string;
}

export function useFileVersions(fileId: string) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const versionsQuery = useQuery<FileVersion[]>({
    queryKey: ["file", fileId, "versions"],
    queryFn: () => apiClient(`/files/${fileId}/versions`),
  });

  const saveVersion = useMutation({
    mutationFn: ({ name, thumbnailUrl }: { name: string; thumbnailUrl?: string }) =>
      apiClient(`/files/${fileId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, thumbnailUrl }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["file", fileId, "versions"] });
    },
  });

  const restoreVersion = useMutation({
    mutationFn: (versionId: string) =>
      apiClient(`/files/${fileId}/versions/${versionId}/restore`, { method: "POST" }),
    // Returning this promise matters: VersionHistoryPanel's per-call
    // onSuccess (which triggers the editor's remount) must run only after
    // this refetch resolves, or the remount could render with the
    // pre-restore data still cached.
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ["file", fileId] });
    },
  });

  return { versionsQuery, saveVersion, restoreVersion };
}
