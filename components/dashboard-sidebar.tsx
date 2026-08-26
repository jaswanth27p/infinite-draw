"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Home, Users, Star, Trash2, Settings, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NewFileButton } from "@/components/new-file-button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/shared", label: "Shared", icon: Users },
  { href: "/starred", label: "Starred", icon: Star },
  { href: "/trash", label: "Trash", icon: Trash2 },
] as const;

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof Home; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}

function SidebarContent() {
  const pathname = usePathname();
  return (
    <div className="flex h-full w-64 flex-col gap-6 p-4">
      <Link href="/home" className="px-2 font-semibold tracking-tight">
        infinite-draw
      </Link>
      <NewFileButton />
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} active={pathname === item.href} />
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-1 border-t border-border pt-4">
        <NavLink href="/settings" label="Settings" icon={Settings} active={pathname === "/settings"} />
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="hidden border-r border-border sm:block">
        <SidebarContent />
      </div>
      <div className="flex items-center justify-between border-b border-border p-3 sm:hidden">
        <Link href="/home" className="font-semibold tracking-tight">
          infinite-draw
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open menu" />}>
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
