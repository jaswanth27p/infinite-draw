"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useApiClient } from "@/lib/api-client";

interface RenameFileDialogProps {
  fileId: string;
  currentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenameFileDialog({ fileId, currentName, open, onOpenChange }: RenameFileDialogProps) {
  const apiClient = useApiClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState(currentName);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) return;
    setError(null);
    setIsPending(true);
    try {
      await apiClient(`/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
    } catch {
      setError("Couldn't rename this file — try again.");
      setIsPending(false);
      return;
    }
    setIsPending(false);
    onOpenChange(false);
    queryClient.invalidateQueries({ queryKey: ["file-list"] });
    router.refresh();
    toast.success("File renamed");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setName(currentName);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename file</DialogTitle>
          <DialogDescription>Choose a new name for this file.</DialogDescription>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
          }}
          autoFocus
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending || !name.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
