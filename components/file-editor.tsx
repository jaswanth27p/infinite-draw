"use client";

import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { useState } from "react";
import "@excalidraw/excalidraw/index.css";
import { useFileQuery } from "@/hooks/use-file-query";
import { useAutosave } from "@/hooks/use-autosave";
import { VersionHistoryPanel } from "@/components/version-history-panel";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false },
);

export function FileEditor({ fileId }: { fileId: string }) {
  const { data, isLoading, isError, error } = useFileQuery(fileId);
  const { scheduleSave, isSaving } = useAutosave(fileId);
  const [remountKey, setRemountKey] = useState(0);

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
    <div className="relative flex flex-1 flex-col">
      <div className="flex items-center justify-end gap-2 border-b p-2">
        {isSaving && <span className="text-xs text-muted-foreground">Saving…</span>}
        <VersionHistoryPanel fileId={fileId} onRestored={() => setRemountKey((k) => k + 1)} />
      </div>
      <div className="relative flex-1">
        <Excalidraw
          key={remountKey}
          initialData={{
            elements: data!.currentData.elements as never,
            appState: data!.currentData.appState,
          }}
          onChange={(elements, appState) => {
            scheduleSave(elements as unknown[], appState as unknown as Record<string, unknown>);
          }}
        />
      </div>
    </div>
  );
}
