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

interface SharedFileListItem extends FileListItem {
  role: "EDITOR" | "VIEWER";
  owner: { name: string | null; email: string };
}

async function FileGrid() {
  const { owned, sharedWithMe }: { owned: FileListItem[]; sharedWithMe: SharedFileListItem[] } =
    await apiFetchServer("/files");

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-muted-foreground">My files</h2>
        {owned.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files yet — create one to get started.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {owned.map((file) => (
              <FileCard key={file.id} file={file} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-muted-foreground">Shared with me</h2>
        {sharedWithMe.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files have been shared with you yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {sharedWithMe.map((file) => (
              <FileCard key={file.id} file={file} />
            ))}
          </div>
        )}
      </section>
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
