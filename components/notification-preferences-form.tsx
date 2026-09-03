"use client";

import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificationPreferences, type NotificationPreferences } from "@/hooks/use-notification-preferences";

const LABELS: Record<keyof NotificationPreferences, string> = {
  notifyFileShared: "A file is shared with you",
  notifyRoleChanged: "Your role on a file changes",
  notifyAccessRemoved: "Your access to a file is removed",
  notifyMentioned: "Someone mentions you in chat",
};

const PREFERENCE_KEYS = Object.keys(LABELS) as (keyof NotificationPreferences)[];

export function NotificationPreferencesForm() {
  const { preferences, isLoading, setPreference } = useNotificationPreferences();

  if (isLoading || !preferences) {
    return (
      <div className="flex flex-col gap-3">
        {PREFERENCE_KEYS.map((key) => (
          <Skeleton key={key} className="h-6 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {PREFERENCE_KEYS.map((key) => (
        <label key={key} className="flex items-center justify-between gap-4 text-sm">
          <span>{LABELS[key]}</span>
          <Switch checked={preferences[key]} onCheckedChange={(checked) => setPreference(key, checked)} />
        </label>
      ))}
    </div>
  );
}
