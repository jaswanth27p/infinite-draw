"use client";

import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificationPreferences, type NotificationPreferences } from "@/hooks/use-notification-preferences";

const ITEMS: Record<keyof NotificationPreferences, { title: string; description: string }> = {
  notifyFileShared: {
    title: "File shared with you",
    description: "Someone grants you access to a file.",
  },
  notifyRoleChanged: {
    title: "Role changed",
    description: "Your role on a shared file changes.",
  },
  notifyAccessRemoved: {
    title: "Access removed",
    description: "You lose access to a file you could previously open.",
  },
  notifyMentioned: {
    title: "Mentions",
    description: "Someone @-mentions you in a file's chat.",
  },
};

const PREFERENCE_KEYS = Object.keys(ITEMS) as (keyof NotificationPreferences)[];

export function NotificationPreferencesForm() {
  const { preferences, isLoading, setPreference } = useNotificationPreferences();

  if (isLoading || !preferences) {
    return (
      <div className="flex flex-col gap-4">
        {PREFERENCE_KEYS.map((key) => (
          <Skeleton key={key} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {PREFERENCE_KEYS.map((key) => (
        <label
          key={key}
          className="flex items-center justify-between gap-4 rounded-lg px-2 py-2 transition-colors hover:bg-accent/50"
        >
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{ITEMS[key].title}</span>
            <span className="text-xs text-muted-foreground">{ITEMS[key].description}</span>
          </span>
          <Switch checked={preferences[key]} onCheckedChange={(checked) => setPreference(key, checked)} />
        </label>
      ))}
    </div>
  );
}
