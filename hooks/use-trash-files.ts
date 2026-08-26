"use client";
import { usePaginatedFiles } from "@/hooks/use-paginated-files";
import type { TrashedFileListItem } from "@/lib/file-types";

export function useTrashFiles() {
  return usePaginatedFiles<TrashedFileListItem>("/files/trash");
}
