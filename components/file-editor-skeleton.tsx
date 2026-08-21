import { Skeleton } from "@/components/ui/skeleton";

export function FileEditorSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b p-2">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="size-8" />
          <Skeleton className="size-8" />
          <Skeleton className="size-8" />
          <Skeleton className="size-8" />
        </div>
      </div>
      <div className="relative flex-1">
        <Skeleton className="absolute inset-4 rounded-lg" />
      </div>
    </div>
  );
}
