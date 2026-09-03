"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "infinite-draw:sidebar-collapsed";

export function useSidebarCollapsed(): [boolean, (collapsed: boolean) => void] {
  const [collapsed, setCollapsedState] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "true" || stored === "false") {
      setCollapsedState(stored === "true");
    }
  }, []);

  const setCollapsed = useCallback((next: boolean) => {
    setCollapsedState(next);
    window.localStorage.setItem(STORAGE_KEY, String(next));
  }, []);

  return [collapsed, setCollapsed];
}
