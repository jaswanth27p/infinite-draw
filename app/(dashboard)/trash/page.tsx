import { Suspense } from "react";
import { Trash2 } from "lucide-react";
import { apiFetchServer } from "@/lib/api-server";
import { TrashFileCard } from "@/components/trash-file-card";
import { EmptyState } from "@/components/empty-state";
import { FileGridSkeleton } from "@/components/file-grid-skeleton";

interface TrashedFileListItem {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  deletedAt: string;
}

async function FileGrid() {
  const files: TrashedFileListItem[] = await apiFetchServer("/files/trash");

  if (files.length === 0) {
    return (
      <EmptyState
        icon={Trash2}
        title="Trash is empty"
        description="Deleted files show up here for you to restore or remove for good."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {files.map((file) => (
        <TrashFileCard key={file.id} file={file} />
      ))}
    </div>
  );
}

export default function TrashPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Trash</h1>
      <Suspense fallback={<FileGridSkeleton />}>
        <FileGrid />
      </Suspense>
    </main>
  );
}
