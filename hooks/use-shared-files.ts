"use client";
import { usePaginatedFiles } from "@/hooks/use-paginated-files";
import type { SharedFileListItem } from "@/lib/file-types";

export function useSharedFiles() {
  return usePaginatedFiles<SharedFileListItem>("/files/shared");
}
