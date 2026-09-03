"use client";

import { useCallback } from "react";
import { useApiClient } from "@/lib/api-client";

export function useImageUpload(fileId: string) {
  const apiClient = useApiClient();

  return useCallback(
    async (_id: string, blob: Blob, mimeType: string): Promise<string> => {
      const { uploadUrl, publicUrl } = await apiClient("/storage/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, kind: "image", contentType: mimeType }),
      });

      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": mimeType },
        body: blob,
      });
      if (!res.ok) {
        throw new Error(`Image upload failed: ${res.status}`);
      }

      return publicUrl as string;
    },
    [apiClient, fileId],
  );
}
