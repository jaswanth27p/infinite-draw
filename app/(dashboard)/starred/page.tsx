import { Suspense } from "react";
import { Star } from "lucide-react";
import { apiFetchServer } from "@/lib/api-server";
import { EmptyState } from "@/components/empty-state";
import { FileGridSkeleton } from "@/components/file-grid-skeleton";
import { FileBrowser } from "@/components/file-browser";
import type { FileListItem } from "@/lib/file-types";

async function FileGrid() {
  const files: FileListItem[] = await apiFetchServer("/files/starred");

  if (files.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title="No starred files"
        description="Files you star will show up here."
      />
    );
  }

  return <FileBrowser files={files} />;
}

export default function StarredPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Starred</h1>
      <Suspense fallback={<FileGridSkeleton />}>
        <FileGrid />
      </Suspense>
    </main>
  );
}
