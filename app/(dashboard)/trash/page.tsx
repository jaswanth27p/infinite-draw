"use client";

import { Trash2 } from "lucide-react";
import { VirtualizedFileList } from "@/components/virtualized-file-list";
import { TrashFileCard } from "@/components/trash-file-card";
import { Input } from "@/components/ui/input";
import { useTrashFiles } from "@/hooks/use-trash-files";
import { useFileSearch } from "@/hooks/use-file-search";

export default function TrashPage() {
  const { query, setQuery, debouncedQuery } = useFileSearch();
  const listQuery = useTrashFiles(debouncedQuery);

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Trash</h1>
      <VirtualizedFileList
        query={listQuery}
        emptyIcon={Trash2}
        emptyTitle="Trash is empty"
        emptyDescription="Deleted files show up here for you to restore or remove for good."
        errorMessage="Couldn't load trash"
        renderCard={(file) => <TrashFileCard file={file} />}
        showViewToggle={false}
        toolbar={
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search trash…"
            className="max-w-xs"
          />
        }
      />
    </main>
  );
}
