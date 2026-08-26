"use client";

import { useCallback, useRef } from "react";
import { useApiClient } from "@/lib/api-client";
import { useThumbnailUpload } from "@/hooks/use-thumbnail-upload";
import { exportCurrentThumbnail } from "@/lib/export-thumbnail";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

const THUMBNAIL_DEBOUNCE_MS = 8000;

export function useThumbnailAutosave(fileId: string) {
  const apiClient = useApiClient();
  const uploadThumbnail = useThumbnailUpload(fileId);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedule = useCallback(
    (api: ExcalidrawImperativeAPI, resolvedTheme: string | undefined) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const blob = await exportCurrentThumbnail(api, resolvedTheme);
        const thumbnailUrl = await uploadThumbnail(blob);
        await apiClient(`/files/${fileId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ thumbnailUrl }),
        });
      }, THUMBNAIL_DEBOUNCE_MS);
    },
    [apiClient, uploadThumbnail, fileId],
  );

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { schedule, cancel };
}
