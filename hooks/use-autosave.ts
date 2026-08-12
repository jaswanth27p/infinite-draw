"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { useApiClient } from "@/lib/api-client";
import type { FileRecord } from "@/hooks/use-file-query";

const AUTOSAVE_DEBOUNCE_MS = 2500;

export function useAutosave(fileId: string) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPayloadRef = useRef<{ elements: unknown[]; appState: Record<string, unknown> } | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: { elements: unknown[]; appState: Record<string, unknown> }) =>
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
      pendingPayloadRef.current = { elements, appState };
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
