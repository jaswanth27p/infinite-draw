import { Suspense } from "react";
import { Users } from "lucide-react";
import { apiFetchServer } from "@/lib/api-server";
import { EmptyState } from "@/components/empty-state";
import { FileGridSkeleton } from "@/components/file-grid-skeleton";
import { FileBrowser } from "@/components/file-browser";
import type { SharedFileListItem } from "@/lib/file-types";

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

  return <FileBrowser files={sharedWithMe} />;
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
