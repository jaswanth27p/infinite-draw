"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseMermaidToExcalidraw } from "@excalidraw/mermaid-to-excalidraw";
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { useApiClient } from "@/lib/api-client";

interface MermaidResponse {
  mermaid: string;
}

async function toElements(mermaid: string): Promise<ExcalidrawElement[]> {
  const { elements } = await parseMermaidToExcalidraw(mermaid);
  return convertToExcalidrawElements(elements) as ExcalidrawElement[];
}

export function useAiDiagram(fileId: string) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const generate = useMutation({
    mutationFn: async (prompt: string) => {
      const { mermaid } = (await apiClient(`/files/${fileId}/ai-diagram/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, requestId: crypto.randomUUID() }),
      })) as MermaidResponse;
      return mermaid;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["credits", "balance"] }),
  });

  const modify = useMutation({
    mutationFn: async ({
      prompt,
      selectedElements,
    }: {
      prompt: string;
      selectedElements: readonly ExcalidrawElement[];
    }) => {
      const { mermaid } = (await apiClient(`/files/${fileId}/ai-diagram/modify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, requestId: crypto.randomUUID(), selectedElements }),
      })) as MermaidResponse;
      return toElements(mermaid);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["credits", "balance"] }),
  });

  return {
    generateMermaid: (prompt: string) => generate.mutateAsync(prompt),
    modifyDiagram: (prompt: string, selectedElements: readonly ExcalidrawElement[]) =>
      modify.mutateAsync({ prompt, selectedElements }),
    isGenerating: generate.isPending,
    isModifying: modify.isPending,
  };
}
