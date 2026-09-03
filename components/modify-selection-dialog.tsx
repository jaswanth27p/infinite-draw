"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { exportToSvg } from "@excalidraw/excalidraw";
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
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { BinaryFiles, ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

interface ModifySelectionDialogProps {
  fileId: string;
  excalidrawApi: ExcalidrawImperativeAPI | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DialogError = { kind: "insufficient-credits" } | { kind: "generic"; message: string };

// Reuses the same exportToSvg the app already relies on for thumbnails
// (lib/export-thumbnail.ts) to render a static preview snippet, rather than
// mounting a second interactive Excalidraw canvas just to show one.
async function renderPreviewSvg(
  elements: readonly ExcalidrawElement[],
  files: BinaryFiles,
  isDark: boolean,
): Promise<string | null> {
  if (elements.length === 0) return null;
  const svg = await exportToSvg({
    elements,
    files,
    appState: { exportBackground: true, viewBackgroundColor: "#ffffff", exportWithDarkMode: isDark },
  });
  return svg.outerHTML;
}

// Same entry point as "Generate diagram" / "Mermaid" (the AI tools dropdown
// in ai-dialog-trigger.tsx) and the same prompt-then-preview-then-insert
// shape as Excalidraw's own TTDDialog: this shows the current selection
// first, lets the user regenerate a modified version into the same preview
// pane without touching the canvas, then Apply/Cancel/Reset commit or
// discard it explicitly.
export function ModifySelectionDialog({ fileId, excalidrawApi, open, onOpenChange }: ModifySelectionDialogProps) {
  const { modifyDiagram, isModifying } = useAiDiagram(fileId);
  const { balance } = useCredits();
  const { resolvedTheme } = useTheme();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<DialogError | null>(null);
  const [originalElements, setOriginalElements] = useState<ExcalidrawElement[]>([]);
  const [previewElements, setPreviewElements] = useState<ExcalidrawElement[] | null>(null);
  const [previewSvg, setPreviewSvg] = useState<string | null>(null);
  const [isRenderingPreview, setIsRenderingPreview] = useState(false);

  // Capture the current selection once, when the dialog opens — not on
  // every render — so the preview doesn't shift under the user's feet if
  // the live canvas selection changes for any reason while this is open.
  useEffect(() => {
    if (!open || !excalidrawApi) return;
    const appState = excalidrawApi.getAppState();
    const selected = excalidrawApi.getSceneElements().filter((el) => appState.selectedElementIds[el.id]);
    // Syncing from Excalidraw's imperative API (an external system), not
    // derivable during render — same pattern as voice-controls.tsx.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOriginalElements(selected);
    setPreviewElements(null);
    setPrompt("");
    setError(null);
  }, [open, excalidrawApi]);

  // Renders whichever elements are the "active preview" right now — the
  // freshly generated result once one exists, otherwise the original
  // selection — so the preview pane always shows the current selection
  // before the first prompt, per the requested flow.
  useEffect(() => {
    if (!open) return;
    const elementsToRender = previewElements ?? originalElements;
    if (elementsToRender.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewSvg(null);
      return;
    }
    let cancelled = false;
    setIsRenderingPreview(true);
    renderPreviewSvg(elementsToRender, excalidrawApi?.getFiles() ?? {}, resolvedTheme === "dark")
      .then((svg) => {
        if (!cancelled) setPreviewSvg(svg);
      })
      .finally(() => {
        if (!cancelled) setIsRenderingPreview(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, previewElements, originalElements, excalidrawApi, resolvedTheme]);

  async function handleGenerate() {
    if (!prompt.trim() || originalElements.length === 0) return;
    setError(null);
    try {
      const replacement = await modifyDiagram(prompt.trim(), originalElements);
      setPreviewElements(replacement);
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setError({ kind: "insufficient-credits" });
      } else {
        setError({ kind: "generic", message: "Couldn't generate that change — try again." });
      }
    }
  }

  function handleApply() {
    if (!excalidrawApi || !previewElements || originalElements.length === 0) return;
    const originalIds = new Set(originalElements.map((el) => el.id));
    const remaining = excalidrawApi.getSceneElements().filter((el) => !originalIds.has(el.id));
    excalidrawApi.updateScene({ elements: [...remaining, ...previewElements] });
    onOpenChange(false);
  }

  function handleReset() {
    setPreviewElements(null);
    setPrompt("");
    setError(null);
  }

  const hasSelection = originalElements.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modify selection with AI</DialogTitle>
          <DialogDescription>
            {hasSelection
              ? previewElements
                ? "Here's the updated version — apply it, or tweak the prompt and generate again."
                : "Describe how the selected elements should change."
              : "Select elements on the canvas first, then describe the change."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-56 items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
          {isRenderingPreview ? (
            <span className="text-sm text-muted-foreground">Rendering preview…</span>
          ) : previewSvg ? (
            <div
              className="flex h-full w-full items-center justify-center [&_svg]:max-h-full [&_svg]:max-w-full"
              dangerouslySetInnerHTML={{ __html: previewSvg }}
            />
          ) : (
            <span className="text-sm text-muted-foreground">No selection to preview.</span>
          )}
        </div>

        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleGenerate();
            }
          }}
          placeholder="e.g. make these boxes blue and align them in a row"
          maxLength={2000}
          disabled={isModifying || !hasSelection}
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

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {previewElements && (
            <Button variant="outline" onClick={handleReset} disabled={isModifying}>
              Reset
            </Button>
          )}
          <Button
            onClick={() => void handleGenerate()}
            disabled={isModifying || !prompt.trim() || !hasSelection}
            variant={previewElements ? "outline" : "default"}
          >
            {isModifying ? "Generating…" : previewElements ? "Regenerate" : "Generate"}
          </Button>
          {previewElements && (
            <Button onClick={handleApply} disabled={isModifying}>
              Apply
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
