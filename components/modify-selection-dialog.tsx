"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAiDiagram } from "@/hooks/use-ai-diagram";
import { useCredits } from "@/hooks/use-credits";
import { AddCreditsDialog } from "@/components/add-credits-dialog";
import { ApiError } from "@/lib/api-client";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

interface ModifySelectionDialogProps {
  fileId: string;
  excalidrawApi: ExcalidrawImperativeAPI | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DialogError = { kind: "insufficient-credits" } | { kind: "generic"; message: string };

export function ModifySelectionDialog({ fileId, excalidrawApi, open, onOpenChange }: ModifySelectionDialogProps) {
  const { modifyDiagram, isModifying } = useAiDiagram(fileId);
  const { balance } = useCredits();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<DialogError | null>(null);

  const selectedElements = excalidrawApi
    ? excalidrawApi.getSceneElements().filter((el) => excalidrawApi.getAppState().selectedElementIds[el.id])
    : [];

  async function handleApply() {
    if (!prompt.trim() || !excalidrawApi || selectedElements.length === 0) return;
    setError(null);
    try {
      const replacement = await modifyDiagram(prompt.trim(), selectedElements);
      const selectedIds = new Set(selectedElements.map((el) => el.id));
      const remaining = excalidrawApi.getSceneElements().filter((el) => !selectedIds.has(el.id));
      excalidrawApi.updateScene({ elements: [...remaining, ...replacement] });
      setPrompt("");
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setError({ kind: "insufficient-credits" });
      } else {
        setError({ kind: "generic", message: "Couldn't apply that change — try again." });
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modify selection with AI</DialogTitle>
          <DialogDescription>
            {selectedElements.length === 0
              ? "Select elements on the canvas first, then describe the change."
              : "Describe how the selected elements should change."}
          </DialogDescription>
        </DialogHeader>
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. make these boxes blue and align them in a row"
          maxLength={2000}
          disabled={isModifying}
          autoFocus
        />
        {error?.kind === "generic" && <p className="text-sm text-destructive">{error.message}</p>}
        {error?.kind === "insufficient-credits" && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <span>Not enough credits.</span>
            <AddCreditsDialog
              balance={balance}
              trigger={
                <Button variant="link" size="sm" className="h-auto p-0">
                  Add credits
                </Button>
              }
            />
          </div>
        )}
        <Button
          onClick={() => void handleApply()}
          disabled={isModifying || !prompt.trim() || selectedElements.length === 0}
        >
          {isModifying ? "Applying…" : "Apply"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
