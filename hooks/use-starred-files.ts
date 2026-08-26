"use client";
import { usePaginatedFiles } from "@/hooks/use-paginated-files";
import type { FileListItem } from "@/lib/file-types";

export function useStarredFiles() {
  return usePaginatedFiles<FileListItem>("/files/starred");
}
