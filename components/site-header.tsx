import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { CreditsBalance } from "@/components/credits-balance";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between border-b border-black/[.08] px-6 py-3 dark:border-white/[.145]">
      <Link href="/" className="font-semibold">
        infinite-draw
      </Link>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Show when="signed-out">
          <SignInButton mode="modal" forceRedirectUrl="/files" signUpForceRedirectUrl="/files" />
        </Show>
        <Show when="signed-in">
          <CreditsBalance />
          <NotificationBell />
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
