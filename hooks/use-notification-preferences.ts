"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";

export interface NotificationPreferences {
  notifyFileShared: boolean;
  notifyRoleChanged: boolean;
  notifyAccessRemoved: boolean;
  notifyMentioned: boolean;
}

export function useNotificationPreferences() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const query = useQuery<NotificationPreferences>({
    queryKey: ["notification-preferences"],
    queryFn: () => apiClient("/me/notification-preferences"),
  });

  const update = useMutation({
    mutationFn: (patch: Partial<NotificationPreferences>) =>
      apiClient("/me/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    setPreference: (key: keyof NotificationPreferences, value: boolean) => update.mutate({ [key]: value }),
  };
}
