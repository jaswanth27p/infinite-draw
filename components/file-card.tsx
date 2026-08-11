import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FileCardProps {
  file: { id: string; name: string; thumbnailUrl: string | null; updatedAt: string };
}

export function FileCard({ file }: FileCardProps) {
  return (
    <Link href={`/files/${file.id}`}>
      <Card className="transition-colors hover:border-foreground/30">
        <CardHeader>
          <CardTitle className="truncate text-sm">{file.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {file.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external MinIO URL, not a static/local asset
            <img
              src={file.thumbnailUrl}
              alt=""
              className="aspect-video w-full rounded object-cover"
            />
          ) : (
            <div className="aspect-video w-full rounded bg-muted" />
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
