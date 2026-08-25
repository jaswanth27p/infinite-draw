"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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

interface TrashFileCardProps {
  file: { id: string; name: string; thumbnailUrl: string | null; deletedAt: string };
}

export function TrashFileCard({ file }: TrashFileCardProps) {
  const apiClient = useApiClient();
  const router = useRouter();
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
    startTransition(() => router.refresh());
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
    startTransition(() => router.refresh());
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="truncate text-sm">{file.name}</CardTitle>
        <p className="truncate text-xs text-muted-foreground">
          Deleted {new Date(file.deletedAt).toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent>
        {file.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external MinIO URL, not a static/local asset
          <img
            src={file.thumbnailUrl}
            alt=""
            className="aspect-video w-full rounded object-cover opacity-60"
          />
        ) : (
          <div className="aspect-video w-full rounded bg-muted" />
        )}
      </CardContent>
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
