"use client";

import { Search, Trash2 } from "lucide-react";
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
      <VirtualizedFileList
        query={listQuery}
        emptyIcon={Trash2}
        emptyTitle="Trash is empty"
        emptyDescription="Deleted files show up here for you to restore or remove for good."
        errorMessage="Couldn't load trash"
        renderCard={(file) => <TrashFileCard file={file} />}
        showViewToggle={false}
        toolbar={
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search trash…"
              className="pl-8"
            />
          </div>
        }
      />
    </main>
  );
}
