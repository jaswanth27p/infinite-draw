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
      // don't own. The server also derives a fresh, unique key per call
      // (thumbnails/${fileId}/${timestamp}.png) so each version's
      // thumbnail gets its own object instead of overwriting the last
      // one's — so the public URL must come from the response, not be
      // re-derived client-side.
      const { uploadUrl, publicUrl } = await apiClient("/storage/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });

      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/png" },
        body: blob,
      });
      if (!res.ok) {
        throw new Error(`Thumbnail upload failed: ${res.status}`);
      }

      return publicUrl as string;
    },
    [apiClient, fileId],
  );
}
