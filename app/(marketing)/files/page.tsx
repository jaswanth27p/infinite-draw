import { Suspense } from "react";
import { FileText, Users } from "lucide-react";
import { apiFetchServer } from "@/lib/api-server";
import { FileCard } from "@/components/file-card";
import { NewFileButton } from "@/components/new-file-button";
import { EmptyState } from "@/components/empty-state";
import { FilesPageSkeleton } from "@/components/files-page-skeleton";

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
          <EmptyState
            icon={FileText}
            title="No files yet"
            description="Create a file to start drawing, alone or with others."
            action={<NewFileButton />}
          />
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
          <EmptyState
            icon={Users}
            title="Nothing shared with you yet"
            description="Files other people share with you will show up here."
          />
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

export default function FilesPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Your files</h1>
        <NewFileButton />
      </div>
      <Suspense fallback={<FilesPageSkeleton />}>
        <FileGrid />
      </Suspense>
    </main>
  );
}
