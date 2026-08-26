"use client";

import { Trash2 } from "lucide-react";
import { VirtualizedFileList } from "@/components/virtualized-file-list";
import { TrashFileCard } from "@/components/trash-file-card";
import { useTrashFiles } from "@/hooks/use-trash-files";

export default function TrashPage() {
  const query = useTrashFiles();

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Trash</h1>
      <VirtualizedFileList
        query={query}
        emptyIcon={Trash2}
        emptyTitle="Trash is empty"
        emptyDescription="Deleted files show up here for you to restore or remove for good."
        errorMessage="Couldn't load trash"
        renderCard={(file) => <TrashFileCard file={file} />}
        showViewToggle={false}
      />
    </main>
  );
}
