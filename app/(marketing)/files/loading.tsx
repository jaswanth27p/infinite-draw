import { Skeleton } from "@/components/ui/skeleton";
import { FilesPageSkeleton } from "@/components/files-page-skeleton";

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Your files</h1>
        <Skeleton className="h-8 w-24" />
      </div>
      <FilesPageSkeleton />
    </main>
  );
}
