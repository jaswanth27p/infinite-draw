import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { CreditsBalance } from "@/components/credits-balance";

export function DashboardTopbar() {
  return (
    <div className="flex items-center justify-end gap-1 border-b border-border px-4 py-2">
      <ThemeToggle />
      <NotificationBell />
      <CreditsBalance />
      <UserButton />
    </div>
  );
}
