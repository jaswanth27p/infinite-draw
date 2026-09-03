"use client";

import { Star } from "lucide-react";
import { VirtualizedFileList } from "@/components/virtualized-file-list";
import { FileCard } from "@/components/file-card";
import { Input } from "@/components/ui/input";
import { useStarredFiles } from "@/hooks/use-starred-files";
import { useFileSearch } from "@/hooks/use-file-search";

export default function StarredPage() {
  const { query, setQuery, debouncedQuery } = useFileSearch();
  const listQuery = useStarredFiles(debouncedQuery);

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Starred</h1>
      <VirtualizedFileList
        query={listQuery}
        emptyIcon={Star}
        emptyTitle="No starred files"
        emptyDescription="Files you star will show up here."
        errorMessage="Couldn't load starred files"
        renderCard={(file, view) => <FileCard file={file} view={view} />}
        toolbar={
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search starred files…"
            className="max-w-xs"
          />
        }
      />
    </main>
  );
}
