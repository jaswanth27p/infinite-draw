"use client";

import { useCallback } from "react";
import { useApiClient } from "@/lib/api-client";

export function useThumbnailUpload(fileId: string) {
  const apiClient = useApiClient();

  return useCallback(
    async (blob: Blob): Promise<string> => {
      const key = `thumbnails/${fileId}.png`;
      const { uploadUrl } = await apiClient("/storage/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, contentType: "image/png" }),
      });

      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/png" },
        body: blob,
      });

      // Presigned PUT URLs strip query params for the resulting object URL.
      return uploadUrl.split("?")[0];
    },
    [apiClient, fileId],
  );
}
