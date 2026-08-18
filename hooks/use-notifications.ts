"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { useApiClient } from "@/lib/api-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";

export interface NotificationItem {
  id: string;
  type: "FILE_SHARED" | "ROLE_CHANGED" | "ACCESS_REMOVED" | "GENERAL_ACCESS_CHANGED";
  actorName: string | null;
  fileId: string | null;
  fileName: string;
  role: "VIEWER" | "EDITOR" | null;
  read: boolean;
  createdAt: string;
}

interface NotificationsPage {
  items: NotificationItem[];
  nextCursor: string | null;
}

export function useNotifications() {
  const { getToken } = useAuth();
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const getTokenRef = useRef(getToken);
  // eslint-disable-next-line react-hooks/refs
  getTokenRef.current = getToken;

  const notificationsQuery = useQuery<NotificationsPage>({
    queryKey: ["notifications"],
    queryFn: () => apiClient("/notifications"),
  });

  const unreadCountQuery = useQuery<{ count: number }>({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => apiClient("/notifications/unread-count"),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => apiClient(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => apiClient("/notifications/read-all", { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  useEffect(() => {
    let cancelled = false;

    // Same function-form `auth` pattern as hooks/use-collab.ts (sub-project
    // 4): Socket.IO only re-evaluates `auth` on each (re)connection attempt
    // when it's a function, so this mints a fresh Clerk token on every
    // connect/reconnect instead of replaying a stale one.
    const socket = io(WS_URL, {
      auth: (cb) => {
        getTokenRef.current().then(
          (token) => cb({ token }),
          () => cb({ token: null }),
        );
      },
    });

    socket.on("connect_error", (err) => {
      console.error("[notifications] connect error", err);
    });
    socket.on("exception", (err) => {
      console.error("[notifications] server exception", err);
    });

    socket.on("connect", () => {
      socket.emit("join-notifications");
    });

    // A live notification just triggers a refetch of both queries rather
    // than manually splicing the new item into the cache — this repo's
    // existing React Query hooks (e.g. use-file-shares.ts) always
    // invalidate-and-refetch on a mutation rather than hand-editing the
    // cache, and doing the same here avoids having two separate code paths
    // (initial REST fetch vs. WS-driven cache surgery) that could drift
    // out of sync or double-count an arrival.
    socket.on("notification", () => {
      if (cancelled) return;
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [queryClient]);

  return {
    notifications: notificationsQuery.data?.items ?? [],
    unreadCount: unreadCountQuery.data?.count ?? 0,
    markRead: (id: string) => markRead.mutate(id),
    markAllRead: () => markAllRead.mutate(),
  };
}
