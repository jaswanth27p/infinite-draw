"use client";

import { useState } from "react";
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
import { useFileVersions } from "@/hooks/use-file-versions";
import { useFileQuery } from "@/hooks/use-file-query";
import { useThumbnailUpload } from "@/hooks/use-thumbnail-upload";
import { exportCurrentThumbnail } from "@/lib/export-thumbnail";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

interface VersionHistoryPanelProps {
  fileId: string;
  /** Viewers get a read-only history: the list is visible, but "Save
   * version" and every "Restore" button are hidden — a Viewer can't
   * mutate currentData, so offering controls that would 403 on click
   * would just be confusing. */
  canEdit: boolean;
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
  /** The live Excalidraw instance, used to export "Save version"'s
   * thumbnail from what's actually on screen (live appState/theme)
   * instead of the persisted `File.currentData.appState` snapshot,
   * which can be stale — see lib/export-thumbnail.ts. */
  excalidrawApi: ExcalidrawImperativeAPI | null;
  /** The app's current resolved theme (next-themes), forced into the
   * exported thumbnail's background the same way it's forced into the
   * live `<Excalidraw theme={...}>` prop — Excalidraw's own internal
   * appState.theme doesn't always stay in sync with an externally
   * injected theme prop. */
  resolvedTheme: string | undefined;
}

export function VersionHistoryPanel({
  fileId,
  canEdit,
  onRestored,
  flushAutosave,
  cancelAutosave,
  excalidrawApi,
  resolvedTheme,
}: VersionHistoryPanelProps) {
  const { versionsQuery, saveVersion, restoreVersion } = useFileVersions(fileId);
  const { data: file } = useFileQuery(fileId);
  const uploadThumbnail = useThumbnailUpload(fileId);
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
    if (!versionName.trim() || !file || isSaving || !excalidrawApi) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      await flushAutosave();
      const blob = await exportCurrentThumbnail(excalidrawApi, resolvedTheme);
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

        {canEdit && (
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
        )}

        <ul className="mt-4 flex flex-col gap-2 px-4">
          {versionsQuery.data?.map((version) => (
            <li key={version.id} className="flex items-center justify-between text-sm">
              <span>
                {version.name} — {new Date(version.createdAt).toLocaleString()}
                {version.origin === "AUTO" && (
                  <span className="ml-2 text-xs text-muted-foreground">Auto</span>
                )}
              </span>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRestore(version.id)}
                  disabled={restoreVersion.isPending}
                >
                  Restore
                </Button>
              )}
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
