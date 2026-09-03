"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useNotifications, type NotificationItem } from "@/hooks/use-notifications";

function describeNotification(n: NotificationItem): string {
  const actor = n.actorName ?? "Someone";
  const roleLabel = n.role === "EDITOR" ? "Editor" : n.role === "COMMENTER" ? "Commenter" : "Viewer";
  switch (n.type) {
    case "FILE_SHARED":
      return `${actor} shared "${n.fileName}" with you as ${roleLabel}`;
    case "ROLE_CHANGED":
      return `${actor} changed your role on "${n.fileName}" to ${roleLabel}`;
    case "ACCESS_REMOVED":
      return `${actor} removed your access to "${n.fileName}"`;
    case "GENERAL_ACCESS_CHANGED":
      return `General access updated for "${n.fileName}"`;
    case "MENTIONED":
      return `${actor} mentioned you in "${n.fileName}"`;
  }
}

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="icon-sm" className="relative" />}>
        <Bell />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        <span className="sr-only">Notifications</span>
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs font-medium text-muted-foreground">Notifications</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead()}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="flex max-h-96 flex-col gap-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <Link
                key={n.id}
                href={n.type === "ACCESS_REMOVED" ? "/home" : n.fileId ? `/files/${n.fileId}` : "#"}
                onClick={() => markRead(n.id)}
                className={`flex flex-col gap-0.5 rounded-lg px-2 py-2 text-sm hover:bg-muted ${
                  n.read ? "" : "bg-accent/50"
                }`}
              >
                <span>{describeNotification(n)}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </Link>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
