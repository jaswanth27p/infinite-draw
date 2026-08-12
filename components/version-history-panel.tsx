"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { exportToBlob } from "@excalidraw/excalidraw";
import { useFileVersions } from "@/hooks/use-file-versions";
import { useFileQuery, type FileRecord } from "@/hooks/use-file-query";
import { useThumbnailUpload } from "@/hooks/use-thumbnail-upload";

interface VersionHistoryPanelProps {
  fileId: string;
  /** Called after a version is successfully restored, so the editor can
   * force a remount (Excalidraw's `initialData` only applies on mount —
   * this is the only signal that should trigger one; autosave's frequent
   * `updatedAt` changes must NOT trigger it, or the canvas would remount
   * and lose local view state on every autosave cycle). */
  onRestored: () => void;
  /** Flushes the editor's pending debounced autosave, if any, and resolves
   * once it lands. Awaited before exporting/saving a version so the
   * snapshot and thumbnail reflect the latest edits rather than whatever
   * was still sitting in the debounce buffer. */
  flushAutosave: () => Promise<void>;
  /** Clears the editor's pending debounced autosave without saving it.
   * Called before restoring a version so a pending autosave (queued
   * before the restore) can't fire afterward and clobber the
   * just-restored currentData. */
  cancelAutosave: () => void;
}

export function VersionHistoryPanel({
  fileId,
  onRestored,
  flushAutosave,
  cancelAutosave,
}: VersionHistoryPanelProps) {
  const { versionsQuery, saveVersion, restoreVersion } = useFileVersions(fileId);
  const { data: file } = useFileQuery(fileId);
  const uploadThumbnail = useThumbnailUpload(fileId);
  const queryClient = useQueryClient();
  const [versionName, setVersionName] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  // Covers the whole export -> upload -> save sequence, not just the
  // mutation itself, so a fast double-click can't fire two concurrent
  // sequences and the button reflects "busy" from the first click onward.
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleSaveDialogOpenChange(open: boolean) {
    setSaveDialogOpen(open);
    if (open) setSaveError(null);
  }

  async function handleSave() {
    if (!versionName.trim() || !file || isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      // Flush any pending debounced autosave first so both the exported
      // thumbnail and the version snapshot the backend takes of
      // File.currentData reflect the latest edits, not whatever was still
      // sitting in the debounce buffer. Read the file back from the cache
      // afterward rather than the `file` closed over above — that snapshot
      // predates the flush and setQueryData's cache update doesn't
      // retroactively update an already-captured render's variables.
      await flushAutosave();
      const latestFile = queryClient.getQueryData<FileRecord>(["file", fileId]) ?? file;

      const blob = await exportToBlob({
        elements: latestFile.currentData.elements as never,
        appState: { ...latestFile.currentData.appState, exportBackground: true } as never,
        files: null,
      });
      const thumbnailUrl = await uploadThumbnail(blob);
      await saveVersion.mutateAsync({ name: versionName.trim(), thumbnailUrl });

      setVersionName("");
      setSaveDialogOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save version");
    } finally {
      setIsSaving(false);
    }
  }

  function handleRestore(versionId: string) {
    // Cancel (don't flush) any pending debounced autosave before
    // restoring: a save queued right before the click would otherwise be
    // able to land after the restore and clobber the just-restored
    // currentData with stale pre-restore content.
    cancelAutosave();
    restoreVersion.mutate(versionId, { onSuccess: onRestored });
  }

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>History</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Version history</SheetTitle>
        </SheetHeader>

        <Dialog open={saveDialogOpen} onOpenChange={handleSaveDialogOpenChange}>
          <DialogTrigger render={<Button size="sm" className="mx-4" />}>Save version</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Name this version</DialogTitle>
            </DialogHeader>
            <Input
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="e.g. Before redesign"
            />
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogContent>
        </Dialog>

        <ul className="mt-4 flex flex-col gap-2 px-4">
          {versionsQuery.data?.map((version) => (
            <li key={version.id} className="flex items-center justify-between text-sm">
              <span>
                {version.name} — {new Date(version.createdAt).toLocaleString()}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRestore(version.id)}
                disabled={restoreVersion.isPending}
              >
                Restore
              </Button>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
