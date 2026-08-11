"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-8 w-16" aria-hidden />;
  }

  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="rounded-full border border-black/[.08] px-3 py-1 text-sm dark:border-white/[.145]"
      aria-label={`Switch to ${next} mode`}
    >
      {theme === "dark" ? "Dark" : "Light"}
    </button>
  );
}
