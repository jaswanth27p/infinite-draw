import { Suspense } from "react";
import { Users } from "lucide-react";
import { apiFetchServer } from "@/lib/api-server";
import { FileCard } from "@/components/file-card";
import { EmptyState } from "@/components/empty-state";
import { FileGridSkeleton } from "@/components/file-grid-skeleton";

interface SharedFileListItem {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  updatedAt: string;
  role: "EDITOR" | "VIEWER";
  owner: { name: string | null; email: string };
  starred: boolean;
}

async function FileGrid() {
  const { sharedWithMe }: { sharedWithMe: SharedFileListItem[] } = await apiFetchServer("/files");

  if (sharedWithMe.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nothing shared with you yet"
        description="Files other people share with you will show up here."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {sharedWithMe.map((file) => (
        <FileCard key={file.id} file={file} />
      ))}
    </div>
  );
}

export default function SharedPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Shared</h1>
      <Suspense fallback={<FileGridSkeleton />}>
        <FileGrid />
      </Suspense>
    </main>
  );
}
