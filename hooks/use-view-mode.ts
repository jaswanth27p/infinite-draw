"use client";

import { useCallback, useEffect, useState } from "react";

export type ViewMode = "grid" | "list";

const STORAGE_KEY = "infinite-draw:file-view";

export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>("grid");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "grid" || stored === "list") {
      setMode(stored);
    }
  }, []);

  const setViewMode = useCallback((next: ViewMode) => {
    setMode(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return [mode, setViewMode];
}
