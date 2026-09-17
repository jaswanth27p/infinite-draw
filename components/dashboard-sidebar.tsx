"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Home, Users, Star, Trash2, Settings, Menu } from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
// Credits UI disabled (product going free/no-AI) — kept for later re-enable.
// import { CreditsBalance } from "@/components/credits-balance";
import { useSidebarCollapsed } from "@/hooks/use-sidebar-collapsed";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/shared", label: "Shared", icon: Users },
  { href: "/starred", label: "Starred", icon: Star },
  { href: "/trash", label: "Trash", icon: Trash2 },
] as const;

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-150",
        collapsed && "justify-center px-0",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      {active && (
        <span
          aria-hidden
          className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary"
        />
      )}
      <Icon className="size-4 shrink-0" strokeWidth={active ? 2.25 : 2} />
      {collapsed ? <span className="sr-only">{label}</span> : <span className="truncate">{label}</span>}
    </Link>
  );
}

function SidebarContent({
  collapsed,
  showAccountControls = false,
}: {
  collapsed: boolean;
  showAccountControls?: boolean;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  return (
    <div className={cn("flex flex-1 min-h-0 flex-col gap-5 overflow-y-auto p-4", collapsed ? "w-16" : "w-64")}>
      <Link href="/home" className={cn("flex", collapsed ? "justify-center" : "px-2")}>
        <Logo iconOnly={collapsed} />
      </Link>
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} active={pathname === item.href} collapsed={collapsed} />
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-4 border-t border-border pt-4">
        <NavLink
          href="/settings"
          label="Settings"
          icon={Settings}
          active={pathname === "/settings"}
          collapsed={collapsed}
        />
        {showAccountControls && (
          <div className="flex flex-col gap-1 border-t border-border pt-4">
            <ThemeToggle showLabel />
            <NotificationBell mobile showLabel />
            <div className="flex w-full items-center gap-2 px-2.5 py-1.5">
              <UserButton appearance={{ elements: { rootBox: "shrink-0" } }} />
              <span className="truncate text-sm">{user?.fullName ?? user?.primaryEmailAddress?.emailAddress}</span>
            </div>
            {/* <CreditsBalance /> */}
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useSidebarCollapsed();

  return (
    <div className="hidden shrink-0 border-r border-border sm:block">
      <div className={cn("flex h-full flex-col", collapsed ? "w-16" : "w-64")}>
        <SidebarContent collapsed={collapsed} />
        <div className="border-t border-sidebar-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-full gap-2 text-muted-foreground", collapsed ? "justify-center px-0" : "justify-start")}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            {!collapsed && <span className="text-xs">Collapse</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MobileSidebarTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open menu" />}>
        <Menu className="size-4" />
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <SidebarContent collapsed={false} showAccountControls />
      </SheetContent>
    </Sheet>
  );
}
