import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ImageOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StarButton } from "@/components/star-button";
import { FileOptionsMenu } from "@/components/file-options-menu";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { FileListItem, SharedFileListItem } from "@/lib/file-types";

interface FileCardProps {
  file: FileListItem | SharedFileListItem;
  view?: "grid" | "list";
}

function fileRole(file: FileListItem | SharedFileListItem): "OWNER" | "EDITOR" | "COMMENTER" | "VIEWER" {
  return "role" in file ? file.role : "OWNER";
}

function roleLabel(role: "OWNER" | "EDITOR" | "COMMENTER" | "VIEWER"): string {
  return role === "EDITOR" ? "Editor" : role === "COMMENTER" ? "Commenter" : "Viewer";
}

function pickThumbnail(file: FileListItem | SharedFileListItem, resolvedTheme: string | undefined): string | null {
  const preferred = resolvedTheme === "dark" ? file.thumbnailUrlDark : file.thumbnailUrl;
  return preferred ?? file.thumbnailUrl ?? file.thumbnailUrlDark;
}

function ThumbnailPlaceholder({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center bg-muted", className)}>
      <ImageOff className="size-5 text-muted-foreground/40" />
    </div>
  );
}

export function FileCard({ file, view = "grid" }: FileCardProps) {
  const role = fileRole(file);
  const owner = "owner" in file ? file.owner : undefined;
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Match SSR (theme unknown) on first client render; only use resolvedTheme post-mount.
  const thumbnail = pickThumbnail(file, mounted ? resolvedTheme : undefined);
  const timestamp = formatRelativeTime(file.updatedAt);

  if (view === "list") {
    return (
      <div className="flex items-center gap-1">
        <Link href={`/files/${file.id}`} className="min-w-0 flex-1">
          <Card className="h-14 flex-row items-center gap-3 px-3 py-0 ring-1 ring-foreground/10 transition-colors hover:bg-muted/60 hover:ring-foreground/15">
            {thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element -- external MinIO URL, not a static/local asset
              <img src={thumbnail} alt="" className="size-9 shrink-0 rounded-md object-cover" />
            ) : (
              <ThumbnailPlaceholder className="size-9 shrink-0 rounded-md" />
            )}
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm">{file.name}</p>
                {owner && (
                  <p className="truncate text-xs text-muted-foreground">
                    <span className="text-foreground/80">{owner.name ?? owner.email}</span>
                    {" · "}
                    {roleLabel(role)}
                  </p>
                )}
              </div>
              <span className="hidden shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground sm:inline">
                {timestamp}
              </span>
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
    <div className="group/file-card relative">
      <Link href={`/files/${file.id}`}>
        <Card interactive className="overflow-hidden pt-0">
          <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
            {thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element -- external MinIO URL, not a static/local asset
              <img src={thumbnail} alt="" className="size-full object-cover" />
            ) : (
              <ThumbnailPlaceholder className="size-full" />
            )}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/25 to-transparent opacity-100 transition-opacity duration-150 sm:opacity-0 sm:group-hover/file-card:opacity-100 sm:group-focus-within/file-card:opacity-100" />
          </div>
          <CardContent className="flex flex-col gap-1 pt-3">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <div className="flex items-center justify-between gap-2">
              {owner ? (
                <p className="truncate text-xs text-muted-foreground">
                  <span className="text-foreground/80">{owner.name ?? owner.email}</span>
                  {" · "}
                  {roleLabel(role)}
                </p>
              ) : (
                <span />
              )}
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">{timestamp}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-100 transition-opacity duration-150 sm:pointer-events-none sm:opacity-0 sm:group-hover/file-card:pointer-events-auto sm:group-hover/file-card:opacity-100 sm:group-focus-within/file-card:pointer-events-auto sm:group-focus-within/file-card:opacity-100">
        <StarButton fileId={file.id} starred={file.starred} />
        <FileOptionsMenu fileId={file.id} fileName={file.name} starred={file.starred} role={role} />
      </div>
    </div>
  );
}
