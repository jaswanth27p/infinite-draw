import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarButton } from "@/components/star-button";

interface FileCardProps {
  file: {
    id: string;
    name: string;
    thumbnailUrl: string | null;
    updatedAt: string;
    role?: "OWNER" | "EDITOR" | "VIEWER";
    owner?: { name: string | null; email: string };
    starred: boolean;
  };
}

export function FileCard({ file }: FileCardProps) {
  return (
    <div className="relative">
      <Link href={`/files/${file.id}`}>
        <Card interactive>
          <CardHeader>
            <CardTitle className="truncate text-sm">{file.name}</CardTitle>
            {file.owner && (
              <p className="truncate text-xs text-muted-foreground">
                Shared by {file.owner.name ?? file.owner.email} · {file.role === "EDITOR" ? "Editor" : "Viewer"}
              </p>
            )}
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
      <StarButton
        fileId={file.id}
        starred={file.starred}
        className="absolute top-2 right-2 z-10"
      />
    </div>
  );
}
