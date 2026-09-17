"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { ImageOff, RotateCcw, Trash2 } from "lucide-react";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/utils";

interface TrashFileCardProps {
  file: { id: string; name: string; thumbnailUrl: string | null; thumbnailUrlDark: string | null; deletedAt: string };
}

export function TrashFileCard({ file }: TrashFileCardProps) {
  const apiClient = useApiClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();
  const thumbnail = (resolvedTheme === "dark" ? file.thumbnailUrlDark : file.thumbnailUrl) ?? file.thumbnailUrl ?? file.thumbnailUrlDark;
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  // Covers the in-flight request itself — useTransition's isPending only
  // turns true once router.refresh() actually starts, which is after the
  // await already resolved, so it doesn't disable the buttons during the
  // request itself.
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRestore() {
    setError(null);
    setIsSubmitting(true);
    try {
      await apiClient(`/files/${file.id}/restore`, { method: "POST" });
    } catch {
      setError("Couldn't restore this file — try again.");
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
    queryClient.invalidateQueries({ queryKey: ["file-list"] });
    startTransition(() => router.refresh());
    toast.success("File restored");
  }

  async function handleDeleteForever() {
    setError(null);
    setIsSubmitting(true);
    try {
      await apiClient(`/files/${file.id}/permanent`, { method: "DELETE" });
    } catch {
      setError("Couldn't delete this file — try again.");
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["file-list"] });
    startTransition(() => router.refresh());
    toast.success("Deleted forever");
  }

  return (
    <Card className="overflow-hidden pt-0">
      <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element -- external MinIO URL, not a static/local asset
          <img src={thumbnail} alt="" className="size-full object-cover opacity-60" />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted">
            <ImageOff className="size-5 text-muted-foreground/40" />
          </div>
        )}
      </div>
      <CardHeader className="pt-3">
        <CardTitle className="truncate text-sm">{file.name}</CardTitle>
        <p className="truncate font-mono text-[11px] tabular-nums text-muted-foreground">
          Deleted {formatRelativeTime(file.deletedAt)}
        </p>
      </CardHeader>
      <CardFooter className="flex-col items-stretch gap-2">
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestore}
            disabled={isPending || isSubmitting}
            className="flex-1"
          >
            <RotateCcw className="size-4" />
            Restore
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={<Button variant="destructive" size="sm" disabled={isPending || isSubmitting} className="flex-1" />}
            >
              <Trash2 className="size-4" />
              Delete forever
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete &quot;{file.name}&quot; forever?</DialogTitle>
                <DialogDescription>This can&apos;t be undone.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                <Button variant="destructive" onClick={handleDeleteForever} disabled={isPending || isSubmitting}>
                  Delete forever
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
}
