import { Suspense } from "react";
import { apiFetchServer } from "@/lib/api-server";
import { FileCard } from "@/components/file-card";
import { NewFileButton } from "@/components/new-file-button";

interface FileListItem {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  updatedAt: string;
}

async function FileGrid() {
  const files: FileListItem[] = await apiFetchServer("/files");

  if (files.length === 0) {
    return <p className="text-sm text-muted-foreground">No files yet — create one to get started.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {files.map((file) => (
        <FileCard key={file.id} file={file} />
      ))}
    </div>
  );
}

function FileGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="aspect-video animate-pulse rounded bg-muted" />
      ))}
    </div>
  );
}

export default function FilesPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your files</h1>
        <NewFileButton />
      </div>
      <Suspense fallback={<FileGridSkeleton />}>
        <FileGrid />
      </Suspense>
    </main>
  );
}
