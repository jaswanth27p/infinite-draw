import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { CreditsBalance } from "@/components/credits-balance";

export function DashboardTopbar() {
  return (
    <div className="sticky top-0 z-10 flex shrink-0 items-center justify-end gap-1 border-b border-border bg-background px-4 py-2">
      <ThemeToggle />
      <NotificationBell />
      <CreditsBalance />
      <UserButton />
    </div>
  );
}
