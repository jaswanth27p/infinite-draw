"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { useApiClient } from "@/lib/api-client";
import type { FileRecord } from "@/hooks/use-file-query";
import { sanitizeAppStateForSave } from "@/lib/excalidraw-app-state";
import { persistCanvasFiles, type HostedFilesMap } from "@/lib/persist-canvas-files";
import { useImageUpload } from "@/hooks/use-image-upload";
import type { BinaryFiles } from "@excalidraw/excalidraw/types";

const AUTOSAVE_DEBOUNCE_MS = 2500;

type PendingSave = { elements: unknown[]; appState: Record<string, unknown>; files: BinaryFiles };

export function useAutosave(fileId: string, initialHostedFiles?: HostedFilesMap) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const uploadImage = useImageUpload(fileId);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<PendingSave | null>(null);
  // JSON of the last payload that was *successfully* saved, built from the
  // RAW (always-local data: URI) files map, not the resolved/hosted one —
  // comparing raw-to-raw is what makes this a stable no-op check. If this
  // instead compared against the hosted (https://) map that was actually
  // PATCHed, every subsequent tick with an already-uploaded image would
  // permanently look "changed" (data: URI vs https:// URI never match),
  // triggering a save — and a redundant upload skip-check pass — forever.
  const lastSavedRawJsonRef = useRef<string | null>(null);
  // The hosted (https://) files map from the last successful save — used
  // by persistCanvasFiles to skip re-uploading an id it's already seen.
  // Seeded from the file's currently-loaded currentData.files so a file
  // reopened with pre-existing images doesn't re-upload them on its first
  // autosave tick. Starts empty here — the actual seeding happens in the
  // effect below, since `initialHostedFiles` is `undefined` on this
  // component's first render (useFileQuery has no SSR prefetch, so `data`
  // — and therefore `initialHostedFiles` — only becomes defined a few
  // renders later) and `useRef`'s argument is only consumed on that first
  // render. Seeding here directly would permanently lock this ref to `{}`.
  const hostedFilesRef = useRef<HostedFilesMap>({});
  // Guards the seeding effect below so it fires exactly once — the first
  // time `initialHostedFiles` is actually defined — and never again after
  // that, even as `initialHostedFiles` keeps changing identity on later
  // renders (e.g. query refetches). Without this guard, a later render
  // could stomp `hostedFilesRef` back to the file's stale loaded map after
  // a real `flush()` has already updated it with newly-uploaded ids.
  const hasSeededHostedFilesRef = useRef(false);
  useEffect(() => {
    if (!hasSeededHostedFilesRef.current && initialHostedFiles) {
      hostedFilesRef.current = initialHostedFiles;
      hasSeededHostedFilesRef.current = true;
    }
  }, [initialHostedFiles]);

  const mutation = useMutation({
    mutationFn: (payload: { elements: unknown[]; appState: Record<string, unknown>; files: HostedFilesMap }) =>
      apiClient(`/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentData: payload }),
      }) as Promise<FileRecord>,
    onSuccess: (updatedFile) => {
      queryClient.setQueryData<FileRecord>(["file", fileId], (old) =>
        old ? { ...old, ...updatedFile } : old,
      );
    },
  });

  const { mutateAsync } = mutation;

  const flush = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    const pending = pendingRef.current;
    if (!pending) return;
    pendingRef.current = null;

    const hostedFiles = await persistCanvasFiles(pending.files, hostedFilesRef.current, uploadImage);
    await mutateAsync({ elements: pending.elements, appState: pending.appState, files: hostedFiles });

    hostedFilesRef.current = hostedFiles;
    lastSavedRawJsonRef.current = JSON.stringify({
      elements: pending.elements,
      appState: pending.appState,
      files: pending.files,
    });
  }, [mutateAsync, uploadImage]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingRef.current = null;
  }, []);

  const scheduleSave = useCallback(
    (elements: unknown[], appState: Record<string, unknown>, files: BinaryFiles) => {
      const sanitizedAppState = sanitizeAppStateForSave(appState);
      const rawJson = JSON.stringify({ elements, appState: sanitizedAppState, files });
      if (rawJson === lastSavedRawJsonRef.current) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        pendingRef.current = null;
        return;
      }
      pendingRef.current = { elements, appState: sanitizedAppState, files };
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(flush, AUTOSAVE_DEBOUNCE_MS);
    },
    [flush],
  );

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        void flush();
      }
    }
    function handleBeforeUnload() {
      void flush();
    }
    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      void flush();
    };
  }, [flush]);

  return { scheduleSave, isSaving: mutation.isPending, flush, cancel };
}
