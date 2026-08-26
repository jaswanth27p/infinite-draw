"use client";
import { usePaginatedFiles } from "@/hooks/use-paginated-files";
import type { FileListItem } from "@/lib/file-types";

export function useRecentFiles() {
  return usePaginatedFiles<FileListItem>("/files");
}
