import { FileGridSkeleton } from "@/components/file-grid-skeleton";

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
      <FileGridSkeleton />
    </main>
  );
}
