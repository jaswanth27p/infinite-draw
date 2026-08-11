"use client";

import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import "@excalidraw/excalidraw/index.css";
import { useFileQuery } from "@/hooks/use-file-query";
import { useAutosave } from "@/hooks/use-autosave";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false },
);

export function FileEditor({ fileId }: { fileId: string }) {
  const { data, isLoading, isError, error } = useFileQuery(fileId);
  const { scheduleSave, isSaving } = useAutosave(fileId);

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center">Loading file…</div>;
  }

  if (isError) {
    if (error instanceof Error && error.message.includes("404")) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="relative flex-1">
      {isSaving && (
        <span className="absolute right-4 top-4 z-10 text-xs text-muted-foreground">Saving…</span>
      )}
      <Excalidraw
        initialData={{
          elements: data!.currentData.elements as never,
          appState: data!.currentData.appState,
        }}
        onChange={(elements, appState) => {
          scheduleSave(elements as unknown[], appState as unknown as Record<string, unknown>);
        }}
      />
    </div>
  );
}
