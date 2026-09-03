"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { useNotifications } from "@/hooks/use-notifications";
import { describeNotification } from "@/lib/notification-text";

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead()}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Mark all read
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="Activity on your files will show up here." />
      ) : (
        <ul className="flex flex-col gap-1">
          {notifications.map((n) => (
            <li key={n.id}>
              <Link
                href={n.type === "ACCESS_REMOVED" ? "/home" : n.fileId ? `/files/${n.fileId}` : "#"}
                onClick={() => markRead(n.id)}
                className={`flex flex-col gap-0.5 rounded-lg px-3 py-2.5 text-sm hover:bg-muted ${
                  n.read ? "" : "bg-accent/50"
                }`}
              >
                <span>{describeNotification(n)}</span>
                <span className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
