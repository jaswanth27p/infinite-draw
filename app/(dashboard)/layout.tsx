import type { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await auth.protect({ unauthenticatedUrl: "/sign-in" });
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col sm:flex-row">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <DashboardTopbar />
        {children}
      </div>
    </div>
  );
}
