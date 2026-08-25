import { Suspense } from "react";
import { FileText } from "lucide-react";
import { apiFetchServer } from "@/lib/api-server";
import { FileCard } from "@/components/file-card";
import { EmptyState } from "@/components/empty-state";
import { FileGridSkeleton } from "@/components/file-grid-skeleton";

interface FileListItem {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  updatedAt: string;
  starred: boolean;
}

async function FileGrid() {
  const { owned }: { owned: FileListItem[] } = await apiFetchServer("/files");

  if (owned.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No files yet"
        description="Create a file to start drawing, alone or with others."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {owned.map((file) => (
        <FileCard key={file.id} file={file} />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
      <Suspense fallback={<FileGridSkeleton />}>
        <FileGrid />
      </Suspense>
    </main>
  );
}
