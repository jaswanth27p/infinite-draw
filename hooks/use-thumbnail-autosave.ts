"use client";

import { useCallback, useRef } from "react";
import { useApiClient } from "@/lib/api-client";
import { useThumbnailUpload } from "@/hooks/use-thumbnail-upload";
import { exportCurrentThumbnails } from "@/lib/export-thumbnail";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

const THUMBNAIL_DEBOUNCE_MS = 8000;

export function useThumbnailAutosave(fileId: string) {
  const apiClient = useApiClient();
  const uploadThumbnail = useThumbnailUpload(fileId);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedule = useCallback(
    (api: ExcalidrawImperativeAPI) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void (async () => {
          const { light, dark } = await exportCurrentThumbnails(api);
          const [thumbnailUrl, thumbnailUrlDark] = await Promise.all([
            uploadThumbnail(light),
            uploadThumbnail(dark),
          ]);
          await apiClient(`/files/${fileId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ thumbnailUrl, thumbnailUrlDark }),
          });
        })().catch(() => {
          // Best-effort: a failed background thumbnail regen must never
          // interrupt an in-progress edit. The next debounce tick (the
          // user's next edit) tries again.
        });
      }, THUMBNAIL_DEBOUNCE_MS);
    },
    [apiClient, uploadThumbnail, fileId],
  );

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  return { schedule, cancel };
}
