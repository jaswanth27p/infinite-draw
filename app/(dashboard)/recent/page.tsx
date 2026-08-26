"use client";

import { FileText } from "lucide-react";
import { VirtualizedFileList } from "@/components/virtualized-file-list";
import { FileCard } from "@/components/file-card";
import { useRecentFiles } from "@/hooks/use-recent-files";

export default function RecentPage() {
  const query = useRecentFiles();

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Recent</h1>
      <VirtualizedFileList
        query={query}
        emptyIcon={FileText}
        emptyTitle="No files yet"
        emptyDescription="Create a file to start drawing, alone or with others."
        errorMessage="Couldn't load recent files"
        renderCard={(file, view) => <FileCard file={file} view={view} />}
      />
    </main>
  );
}
