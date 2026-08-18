"use client";

import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import "@excalidraw/excalidraw/index.css";
import { useFileQuery } from "@/hooks/use-file-query";
import { useAutosave } from "@/hooks/use-autosave";
import { useCollab } from "@/hooks/use-collab";
import { VersionHistoryPanel } from "@/components/version-history-panel";
import { ShareDialog } from "@/components/share-dialog";
import { ChatPanel } from "@/components/chat-panel";
import { ApiError } from "@/lib/api-client";
import { reviveAppStateForLoad } from "@/lib/excalidraw-app-state";
import { CaptureUpdateAction, getSceneVersion } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false },
);

export function FileEditor({ fileId }: { fileId: string }) {
  const { data, isLoading, isError, error } = useFileQuery(fileId);
  const { scheduleSave, isSaving, flush, cancel } = useAutosave(fileId);
  const [remountKey, setRemountKey] = useState(0);
  const [liveElements, setLiveElements] = useState<readonly ExcalidrawElement[] | null>(null);
  const excalidrawApiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  // Last scene version (getSceneVersion) seen by onChange, used to skip
  // redundant work (scheduleSave + broadcastElements) when onChange fires
  // due to non-element appState changes only — e.g. the collaborators map
  // being updated on every incoming remote cursor move (see the
  // `updateScene({ collaborators })` effect below), which would otherwise
  // re-run a full-scene JSON.stringify and version scan at ~30Hz per peer
  // and keep resetting useAutosave's debounce timer.
  const lastSceneVersionRef = useRef<number | null>(null);

  const handleRemoteSceneUpdate = useCallback((elements: readonly ExcalidrawElement[]) => {
    setLiveElements(elements);
  }, []);
  const getLiveAppState = useCallback(() => excalidrawApiRef.current?.getAppState(), []);
  const {
    collaborators,
    broadcastElements,
    broadcastPointer,
    messages,
    ownMessageIds,
    hasMoreMessages,
    isLoadingOlderMessages,
    sendChatMessage,
    loadOlderMessages,
  } = useCollab(fileId, data?.role ?? "VIEWER", handleRemoteSceneUpdate, getLiveAppState);

  // Applied imperatively (not through `initialData`, which only applies
  // once at mount) so a remote peer's edits land on the live canvas
  // without remounting Excalidraw or disturbing local view state (zoom,
  // scroll, selection). `captureUpdate: NEVER` keeps this out of the local
  // undo/redo history — undoing a remote peer's edit would revert their
  // work and re-broadcast that revert.
  useEffect(() => {
    if (liveElements && excalidrawApiRef.current) {
      excalidrawApiRef.current.updateScene({
        elements: liveElements as never,
        captureUpdate: CaptureUpdateAction.NEVER,
      });
    }
  }, [liveElements]);

  // `collaborators` isn't an `ExcalidrawProps` field in this version of
  // @excalidraw/excalidraw (0.18.1) — it's only settable imperatively via
  // `updateScene`, same as `liveElements` above.
  useEffect(() => {
    excalidrawApiRef.current?.updateScene({ collaborators });
  }, [collaborators]);

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
        <ChatPanel
          messages={messages}
          ownMessageIds={ownMessageIds}
          hasMoreMessages={hasMoreMessages}
          isLoadingOlderMessages={isLoadingOlderMessages}
          onSend={sendChatMessage}
          onLoadOlder={loadOlderMessages}
        />
      </div>
      <div className="relative flex-1">
        <Excalidraw
          key={remountKey}
          viewModeEnabled={isViewer}
          excalidrawAPI={(api) => {
            excalidrawApiRef.current = api;
          }}
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
            // Skip entirely when the scene hasn't actually changed since
            // the last onChange — e.g. this fired only because a remote
            // peer's cursor moved (which updates the `collaborators` map
            // via `updateScene` below, triggering onChange with the same
            // elements). Real edits always bump at least one element's
            // `version`, so `getSceneVersion` catches every genuine change
            // while filtering out this collaboration-cursor noise.
            const sceneVersion = getSceneVersion(elements);
            if (sceneVersion === lastSceneVersionRef.current) return;
            lastSceneVersionRef.current = sceneVersion;

            // Always broadcast first, even for a Viewer: `broadcastElements`
            // writes `localElementsRef` (the base used to reconcile the
            // next incoming remote update) unconditionally and only skips
            // the outgoing socket emit for VIEWER role. If a Viewer's
            // `onChange` never calls this, `localElementsRef` stays `[]`
            // forever, and the next remote delta reconciles against an
            // empty base — wiping the canvas down to just the changed
            // elements. See hooks/use-collab.ts's `broadcastElements`.
            broadcastElements(elements);
            if (isViewer) return;
            scheduleSave(elements as unknown[], appState as unknown as Record<string, unknown>);
          }}
          onPointerUpdate={(payload) => {
            if (isViewer) return;
            broadcastPointer({ pointer: payload.pointer, button: payload.button });
          }}
        />
      </div>
    </div>
  );
}
