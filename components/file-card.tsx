import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarButton } from "@/components/star-button";
import { FileOptionsMenu } from "@/components/file-options-menu";
import type { FileListItem, SharedFileListItem } from "@/lib/file-types";

interface FileCardProps {
  file: FileListItem | SharedFileListItem;
  view?: "grid" | "list";
}

function fileRole(file: FileListItem | SharedFileListItem): "OWNER" | "EDITOR" | "COMMENTER" | "VIEWER" {
  return "role" in file ? file.role : "OWNER";
}

export function FileCard({ file, view = "grid" }: FileCardProps) {
  const role = fileRole(file);
  const owner = "owner" in file ? file.owner : undefined;

  if (view === "list") {
    return (
      <div className="flex items-center gap-1">
        <Link href={`/files/${file.id}`} className="min-w-0 flex-1">
          <Card interactive className="flex-row items-center gap-3 px-3 py-2">
            {file.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- external MinIO URL, not a static/local asset
              <img src={file.thumbnailUrl} alt="" className="size-10 shrink-0 rounded object-cover" />
            ) : (
              <div className="size-10 shrink-0 rounded bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{file.name}</p>
              {owner && (
                <p className="truncate text-xs text-muted-foreground">
                  Shared by {owner.name ?? owner.email} ·{" "}
                  {role === "EDITOR" ? "Editor" : role === "COMMENTER" ? "Commenter" : "Viewer"}
                </p>
              )}
            </div>
          </Card>
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <StarButton fileId={file.id} starred={file.starred} />
          <FileOptionsMenu fileId={file.id} fileName={file.name} starred={file.starred} role={role} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Link href={`/files/${file.id}`}>
        <Card interactive>
          <CardHeader>
            <CardTitle className="truncate text-sm">{file.name}</CardTitle>
            {owner && (
              <p className="truncate text-xs text-muted-foreground">
                Shared by {owner.name ?? owner.email} ·{" "}
                {role === "EDITOR" ? "Editor" : role === "COMMENTER" ? "Commenter" : "Viewer"}
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
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        <StarButton fileId={file.id} starred={file.starred} />
        <FileOptionsMenu fileId={file.id} fileName={file.name} starred={file.starred} role={role} />
      </div>
    </div>
  );
}
