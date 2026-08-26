"use client";

import { Star } from "lucide-react";
import { VirtualizedFileList } from "@/components/virtualized-file-list";
import { FileCard } from "@/components/file-card";
import { useStarredFiles } from "@/hooks/use-starred-files";

export default function StarredPage() {
  const query = useStarredFiles();

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Starred</h1>
      <VirtualizedFileList
        query={query}
        emptyIcon={Star}
        emptyTitle="No starred files"
        emptyDescription="Files you star will show up here."
        errorMessage="Couldn't load starred files"
        renderCard={(file, view) => <FileCard file={file} view={view} />}
      />
    </main>
  );
}
