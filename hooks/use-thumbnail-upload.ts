"use client";

import { useCallback } from "react";
import { useApiClient } from "@/lib/api-client";

export function useThumbnailUpload(fileId: string) {
  const apiClient = useApiClient();

  return useCallback(
    async (blob: Blob): Promise<string> => {
      // Key derivation and content type are fixed server-side from fileId
      // (see StorageController#presign) — this endpoint never accepts a
      // free-form key, so a caller can't presign an upload for a file they
      // don't own.
      const { uploadUrl } = await apiClient("/storage/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
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
