"use client";

import { Users } from "lucide-react";
import { VirtualizedFileList } from "@/components/virtualized-file-list";
import { FileCard } from "@/components/file-card";
import { useSharedFiles } from "@/hooks/use-shared-files";

export default function SharedPage() {
  const query = useSharedFiles();

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Shared</h1>
      <VirtualizedFileList
        query={query}
        emptyIcon={Users}
        emptyTitle="Nothing shared with you yet"
        emptyDescription="Files other people share with you will show up here."
        errorMessage="Couldn't load shared files"
        renderCard={(file, view) => <FileCard file={file} view={view} />}
      />
    </main>
  );
}
