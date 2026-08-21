"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAiDiagram } from "@/hooks/use-ai-diagram";
import { useCredits } from "@/hooks/use-credits";
import { AddCreditsDialog } from "@/components/add-credits-dialog";
import { ApiError } from "@/lib/api-client";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

interface AiDiagramPanelProps {
  fileId: string;
  excalidrawApi: ExcalidrawImperativeAPI | null;
}

type PanelError = { kind: "insufficient-credits" } | { kind: "generic"; message: string };

export function AiDiagramPanel({ fileId, excalidrawApi }: AiDiagramPanelProps) {
  const { generateDiagram, modifyDiagram, isGenerating, isModifying } = useAiDiagram(fileId);
  const { balance } = useCredits();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<PanelError | null>(null);

  const selectedElements = excalidrawApi
    ? excalidrawApi.getSceneElements().filter((el) => excalidrawApi.getAppState().selectedElementIds[el.id])
    : [];
  const hasSelection = selectedElements.length > 0;
  const isBusy = isGenerating || isModifying;

  function errorFrom(err: unknown, fallbackMessage: string): PanelError {
    if (err instanceof ApiError && err.status === 402) {
      return { kind: "insufficient-credits" };
    }
    return { kind: "generic", message: fallbackMessage };
  }

  async function handleGenerate() {
    if (!prompt.trim() || !excalidrawApi) return;
    setError(null);
    try {
      const newElements = await generateDiagram(prompt.trim());
      const existing = excalidrawApi.getSceneElements();
      excalidrawApi.updateScene({ elements: [...existing, ...newElements] });
      setPrompt("");
    } catch (err) {
      setError(errorFrom(err, "Couldn't generate a diagram from that — try rephrasing."));
    }
  }

  async function handleModify() {
    if (!prompt.trim() || !excalidrawApi || !hasSelection) return;
    setError(null);
    try {
      const replacement = await modifyDiagram(prompt.trim(), selectedElements);
      const selectedIds = new Set(selectedElements.map((el) => el.id));
      const remaining = excalidrawApi.getSceneElements().filter((el) => !selectedIds.has(el.id));
      excalidrawApi.updateScene({ elements: [...remaining, ...replacement] });
      setPrompt("");
    } catch (err) {
      setError(errorFrom(err, "Couldn't apply that change — try again."));
    }
  }

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        <Sparkles className="size-4" />
        AI Assist
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>AI Diagram Assist</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-3 p-4">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe a diagram, or a change to your selection…"
            maxLength={2000}
            disabled={isBusy}
          />
          <div className="flex gap-2">
            <Button onClick={() => void handleGenerate()} disabled={isBusy || !prompt.trim()}>
              {isGenerating ? "Generating…" : "Generate"}
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleModify()}
              disabled={isBusy || !prompt.trim() || !hasSelection}
            >
              {isModifying ? "Applying…" : "Modify selection"}
            </Button>
          </div>
          {!hasSelection && (
            <p className="text-xs text-muted-foreground">
              Select elements on the canvas to enable &quot;Modify selection&quot;.
            </p>
          )}
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
