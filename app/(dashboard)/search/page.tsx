"use client";

import { useSearchParams } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import { VirtualizedFileList } from "@/components/virtualized-file-list";
import { FileCard } from "@/components/file-card";
import { EmptyState } from "@/components/empty-state";
import { useSearchFiles } from "@/hooks/use-search-files";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const listQuery = useSearchFiles(q);

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        {q ? `Search results for "${q}"` : "Search"}
      </h1>
      {q.length === 0 ? (
        // useSearchFiles is `enabled: q.length > 0`, so its query stays in
        // a permanent "pending" status for an empty q -- VirtualizedFileList
        // would render a loading skeleton forever rather than resolving to
        // an empty state. Branch here instead of ever mounting it with no
        // query, since "haven't searched yet" and "searched, found nothing"
        // are genuinely different states, not the same empty-results case.
        <EmptyState
          icon={SearchIcon}
          title="Search your files"
          description="Type a search term to find files by name, across everything you own or have access to."
        />
      ) : (
        <VirtualizedFileList
          query={listQuery}
          emptyIcon={SearchIcon}
          emptyTitle="No matching files"
          emptyDescription="Try a different search term."
          errorMessage="Couldn't search files"
          renderCard={(file, view) => <FileCard file={file} view={view} />}
        />
      )}
    </main>
  );
}
