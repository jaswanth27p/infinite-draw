import { Suspense } from "react";
import { Star } from "lucide-react";
import { apiFetchServer } from "@/lib/api-server";
import { FileCard } from "@/components/file-card";
import { EmptyState } from "@/components/empty-state";
import { FileGridSkeleton } from "@/components/file-grid-skeleton";

interface StarredFileListItem {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  updatedAt: string;
  starred: boolean;
}

async function FileGrid() {
  const files: StarredFileListItem[] = await apiFetchServer("/files/starred");

  if (files.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title="No starred files"
        description="Files you star will show up here."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {files.map((file) => (
        <FileCard key={file.id} file={file} />
      ))}
    </div>
  );
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
