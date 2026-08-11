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

interface VersionHistoryPanelProps {
  fileId: string;
  /** Called after a version is successfully restored, so the editor can
   * force a remount (Excalidraw's `initialData` only applies on mount —
   * this is the only signal that should trigger one; autosave's frequent
   * `updatedAt` changes must NOT trigger it, or the canvas would remount
   * and lose local view state on every autosave cycle). */
  onRestored: () => void;
}

export function VersionHistoryPanel({ fileId, onRestored }: VersionHistoryPanelProps) {
  const { versionsQuery, saveVersion, restoreVersion } = useFileVersions(fileId);
  const [versionName, setVersionName] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  function handleSave() {
    if (!versionName.trim()) return;
    saveVersion.mutate(versionName.trim(), {
      onSuccess: () => {
        setVersionName("");
        setSaveDialogOpen(false);
      },
    });
  }

  function handleRestore(versionId: string) {
    restoreVersion.mutate(versionId, { onSuccess: onRestored });
  }

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>History</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Version history</SheetTitle>
        </SheetHeader>

        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
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
            <Button onClick={handleSave} disabled={saveVersion.isPending}>
              {saveVersion.isPending ? "Saving…" : "Save"}
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
