"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeModeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Hydration guard: the selected theme is unknown until the client mounts.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // Use the raw `theme` (the literal "system" until the user picks one), not
  // `resolvedTheme` — this control selects a *mode*, so "System" must read as
  // active on the default, even when the resolved color scheme is dark.
  const active = mounted ? (theme ?? "system") : "system";

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          type="button"
          variant="ghost"
          size="sm"
          role="radio"
          aria-checked={active === value}
          onClick={() => setTheme(value)}
          className={cn(
            "flex-1 gap-1.5 text-muted-foreground hover:text-foreground",
            active === value && "bg-background text-foreground shadow-xs hover:bg-background",
          )}
        >
          <Icon className="size-4" />
          {label}
        </Button>
      ))}
    </div>
  );
}
