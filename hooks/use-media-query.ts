"use client";

import { useEffect, useState } from "react";

// Defaults to false and corrects after mount (matching this codebase's
// existing next-themes "mounted" pattern in theme-toggle.tsx) rather
// than reading window.matchMedia synchronously in the initializer --
// the latter would make the client's first render diverge from the
// server-rendered HTML (which has no window at all) and trigger a
// hydration mismatch. The brief flash of the "no match" layout on
// first paint is the accepted tradeoff.
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    setMatches(mediaQueryList.matches);
    function handleChange(e: MediaQueryListEvent) {
      setMatches(e.matches);
    }
    mediaQueryList.addEventListener("change", handleChange);
    return () => mediaQueryList.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}
