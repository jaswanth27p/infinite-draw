"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { useApiClient } from "@/lib/api-client";
import type { FileRecord } from "@/hooks/use-file-query";
import { sanitizeAppStateForSave } from "@/lib/excalidraw-app-state";

const AUTOSAVE_DEBOUNCE_MS = 2500;

type AutosavePayload = { elements: unknown[]; appState: Record<string, unknown> };

export function useAutosave(fileId: string) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPayloadRef = useRef<AutosavePayload | null>(null);
  // JSON of the last payload that was *successfully* saved, used by
  // scheduleSave to skip re-arming the debounce timer when Excalidraw's
  // onChange fires with no real change (it fires on ephemeral/derived
  // state too, not just real edits — see AUTOSAVE_DEBOUNCE_MS usage
  // below). Deliberately updated only after the save resolves, not when
  // it's merely scheduled/sent.
  const lastSavedPayloadJsonRef = useRef<string | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: AutosavePayload) =>
      apiClient(`/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentData: payload }),
      }) as Promise<FileRecord>,
    onSuccess: (updatedFile) => {
      // The PATCH response already is the fresh file record — write it
      // straight into the cache instead of invalidating. Invalidating
      // ["file", fileId] is prefix-based by default and would also
      // invalidate ["file", fileId, "versions"], forcing the (always
      // mounted) VersionHistoryPanel to re-fetch every historical
      // version on every ~2.5s autosave tick, even though autosave never
      // touches versions.
      queryClient.setQueryData<FileRecord>(["file", fileId], updatedFile);
    },
  });

  const { mutateAsync } = mutation;

  const flush = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // pendingPayloadRef always holds the *latest* scheduled payload (each
    // scheduleSave call overwrites it), so reading it here — whether flush
    // runs from a timer, a visibility/unload event, or the unmount
    // cleanup — always saves the most recent edits, never a stale one.
    const pending = pendingPayloadRef.current;
    if (pending) {
      pendingPayloadRef.current = null;
      await mutateAsync(pending);
      // Record the payload as saved only after the request resolves
      // successfully — if it rejects, this is left stale on purpose so a
      // later identical-looking scheduleSave call isn't wrongly skipped.
      lastSavedPayloadJsonRef.current = JSON.stringify(pending);
    }
  }, [mutateAsync]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingPayloadRef.current = null;
  }, []);

  const scheduleSave = useCallback(
    (elements: unknown[], appState: Record<string, unknown>) => {
      // Strip non-JSON-safe / purely interaction-transient appState
      // fields (collaborators is a Map at runtime, etc.) before this
      // payload ever reaches the network — see lib/excalidraw-app-state.ts.
      const payload: AutosavePayload = { elements, appState: sanitizeAppStateForSave(appState) };
      const payloadJson = JSON.stringify(payload);
      if (payloadJson === lastSavedPayloadJsonRef.current) {
        // No real change since the last successful save — Excalidraw's
        // onChange fires on ephemeral/derived state changes too, and
        // without this check that kept re-arming the debounce timer
        // forever, producing an unbounded stream of byte-identical PATCH
        // requests while the file sat idle.
        return;
      }
      pendingPayloadRef.current = payload;
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
      // Flush (not just clear) on unmount: same-tab navigation away from
      // the editor (e.g. the "Files" header link) unmounts this component
      // without ever firing beforeunload/visibilitychange, so a pending
      // debounced edit would otherwise be silently dropped.
      void flush();
    };
  }, [flush]);

  return { scheduleSave, isSaving: mutation.isPending, flush, cancel };
}
