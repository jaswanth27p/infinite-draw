"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Home, Users, Star, Trash2, Settings, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/logo";
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
        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors",
        collapsed && "justify-center",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {collapsed ? <span className="sr-only">{label}</span> : label}
    </Link>
  );
}

function SidebarContent({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  return (
    <div className={cn("flex h-full flex-col gap-6 p-4", collapsed ? "w-14" : "w-64")}>
      <Link href="/home" className="px-2">
        <Logo iconOnly={collapsed} />
      </Link>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} active={pathname === item.href} collapsed={collapsed} />
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-1 border-t border-border pt-4">
        <NavLink
          href="/settings"
          label="Settings"
          icon={Settings}
          active={pathname === "/settings"}
          collapsed={collapsed}
        />
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useSidebarCollapsed();

  return (
    <>
      <div className="hidden border-r border-border sm:block">
        <div className={cn("flex h-full flex-col", collapsed ? "w-14" : "w-64")}>
          <div className="flex-1">
            <SidebarContent collapsed={collapsed} />
          </div>
          <div className="border-t border-border p-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-full"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </Button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-b border-border p-3 sm:hidden">
        <Link href="/home">
          <Logo />
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open menu" />}>
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <SidebarContent collapsed={false} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
