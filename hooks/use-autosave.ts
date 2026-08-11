"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { useApiClient } from "@/lib/api-client";

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
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["file", fileId] });
    },
  });

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pendingPayloadRef.current) {
      mutation.mutate(pendingPayloadRef.current);
      pendingPayloadRef.current = null;
    }
  }, [mutation]);

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
        flush();
      }
    }
    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", flush);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [flush]);

  return { scheduleSave, isSaving: mutation.isPending };
}
