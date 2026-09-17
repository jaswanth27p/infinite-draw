"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
// Credits UI disabled (product going free/no-AI) — kept for later re-enable.
// import { CreditsBalance } from "@/components/credits-balance";

const PAGE_TITLES: Record<string, string> = {
  "/home": "Home",
  "/shared": "Shared",
  "/starred": "Starred",
  "/trash": "Trash",
  "/settings": "Settings",
  "/recent": "Recent",
  "/notifications": "Notifications",
};

function getPageTitle(pathname: string): string {
  return PAGE_TITLES[pathname] ?? "infinite-draw";
}

export function DashboardTopbar({ mobileNav }: { mobileNav?: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-10 shrink-0 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-2 px-4 py-3 sm:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <div className="sm:hidden">{mobileNav}</div>
          <h1 className="truncate font-heading text-lg font-semibold tracking-tight sm:text-xl">
            {getPageTitle(pathname)}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          <NotificationBell />
          {/* <CreditsBalance /> */}
          <UserButton />
        </div>
      </div>
    </div>
  );
}
