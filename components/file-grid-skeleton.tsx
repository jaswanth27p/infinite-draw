import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function FileGridSkeleton({ count = 8, view = "grid" }: { count?: number; view?: "grid" | "list" }) {
  if (view === "list") {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex h-14 items-center gap-3 rounded-xl bg-card px-3 ring-1 ring-foreground/10">
            <Skeleton className="size-9 shrink-0 rounded-md" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden pt-0">
          <Skeleton className="aspect-video w-full rounded-none" />
          <CardContent className="flex flex-col gap-2 pt-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
