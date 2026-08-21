import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function FileCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent>
        <Skeleton className="aspect-video w-full" />
      </CardContent>
    </Card>
  );
}

export function FileGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <FileCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function FilesPageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <Skeleton className="h-4 w-20" />
        <FileGridSkeleton />
      </section>
      <section className="flex flex-col gap-4">
        <Skeleton className="h-4 w-28" />
        <FileGridSkeleton />
      </section>
    </div>
  );
}
