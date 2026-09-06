"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean } = {}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Hydration guard: resolvedTheme is unknown until the client mounts, so this setState-in-effect is intentional.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={showLabel ? "h-8 w-full" : "size-8"} aria-hidden />;
  }

  // Always toggle off the *resolved* (actually-applied) theme, not the raw
  // `theme` setting — which is literally the string "system" until the user
  // has explicitly chosen one. Toggling off "system" on a dark-OS machine
  // would otherwise set theme="dark" while it's already rendering dark,
  // making the button appear to do nothing.
  const next = resolvedTheme === "dark" ? "light" : "dark";
  const Icon = resolvedTheme === "dark" ? Sun : Moon;

  if (showLabel) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-start gap-2"
        onClick={() => setTheme(next)}
        aria-label={`Switch to ${next} mode`}
      >
        <Icon className="size-4 shrink-0" />
        <span className="truncate">{resolvedTheme === "dark" ? "Dark mode" : "Light mode"}</span>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
    >
      <Icon className="size-4" />
    </Button>
  );
}
