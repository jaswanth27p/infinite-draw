import type { NotificationItem } from "@/hooks/use-notifications";

export function describeNotification(n: NotificationItem): string {
  const actor = n.actorName ?? "Someone";
  const roleLabel = n.role === "EDITOR" ? "Editor" : n.role === "COMMENTER" ? "Commenter" : "Viewer";
  switch (n.type) {
    case "FILE_SHARED":
      return `${actor} shared "${n.fileName}" with you as ${roleLabel}`;
    case "ROLE_CHANGED":
      return `${actor} changed your role on "${n.fileName}" to ${roleLabel}`;
    case "ACCESS_REMOVED":
      return `${actor} removed your access to "${n.fileName}"`;
    case "MENTIONED":
      return `${actor} mentioned you in "${n.fileName}"`;
  }
}
