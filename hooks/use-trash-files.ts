"use client";
import { usePaginatedFiles } from "@/hooks/use-paginated-files";
import type { TrashedFileListItem } from "@/lib/file-types";

export function useTrashFiles(q?: string) {
  return usePaginatedFiles<TrashedFileListItem>("/files/trash", 30, q);
}
