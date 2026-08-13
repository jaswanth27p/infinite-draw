"use client";

import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { useState } from "react";
import "@excalidraw/excalidraw/index.css";
import { useFileQuery } from "@/hooks/use-file-query";
import { useAutosave } from "@/hooks/use-autosave";
import { VersionHistoryPanel } from "@/components/version-history-panel";
import { ShareDialog } from "@/components/share-dialog";
import { ApiError } from "@/lib/api-client";
import { reviveAppStateForLoad } from "@/lib/excalidraw-app-state";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false },
);

export function FileEditor({ fileId }: { fileId: string }) {
  const { data, isLoading, isError, error } = useFileQuery(fileId);
  const { scheduleSave, isSaving, flush, cancel } = useAutosave(fileId);
  const [remountKey, setRemountKey] = useState(0);

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center">Loading file…</div>;
  }

  if (isError) {
    // Branch on the numeric status the guard actually returned, not a
    // string-match on the error message: LoadLocalUserGuard returns 403
    // ("your account isn't provisioned yet", e.g. Clerk webhook lag on a
    // new sign-up) which is a different situation from a genuine 404
    // ("that file doesn't exist" / not yours) and needs different UI.
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    if (error instanceof ApiError && error.status === 403) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <h2 className="text-lg font-semibold">Setting up your account…</h2>
          <p className="text-sm text-muted-foreground">
            This can take a few seconds after signing up. Try refreshing shortly.
          </p>
        </div>
      );
    }
    throw error;
  }

  const isViewer = data!.role === "VIEWER";

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="flex items-center justify-end gap-2 border-b p-2">
        {isSaving && <span className="text-xs text-muted-foreground">Saving…</span>}
        {data!.role === "OWNER" && <ShareDialog fileId={fileId} />}
        <VersionHistoryPanel
          fileId={fileId}
          canEdit={!isViewer}
          onRestored={() => setRemountKey((k) => k + 1)}
          flushAutosave={flush}
          cancelAutosave={cancel}
        />
      </div>
      <div className="relative flex-1">
        <Excalidraw
          key={remountKey}
          viewModeEnabled={isViewer}
          initialData={{
            elements: data!.currentData.elements as never,
            // Reconstruct `collaborators`/`followedBy` as real Map/Set
            // instances rather than passing through whatever was stored
            // (persisted data never has real instances of either — see
            // lib/excalidraw-app-state.ts). Excalidraw's InteractiveCanvas
            // calls `.forEach` on `appState.collaborators` expecting a
            // Map; a plain `{}` (or an absent key, for pre-fix rows)
            // throws and permanently bricks this file's editor.
            appState: reviveAppStateForLoad(data!.currentData.appState),
          }}
          onChange={(elements, appState) => {
            if (isViewer) return;
            scheduleSave(elements as unknown[], appState as unknown as Record<string, unknown>);
          }}
        />
      </div>
    </div>
  );
}
