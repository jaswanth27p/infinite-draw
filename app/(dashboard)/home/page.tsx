import { Suspense } from "react";
import Link from "next/link";
import { FileText, Star, Users } from "lucide-react";
import { apiFetchServer } from "@/lib/api-server";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { FileGridSkeleton } from "@/components/file-grid-skeleton";
import { FileBrowser } from "@/components/file-browser";
import { HomeSearchBox } from "@/components/home-search-box";
import { cn } from "@/lib/utils";
import type { FileListItem, SharedFileListItem, PaginatedResponse } from "@/lib/file-types";

function SectionHeader({ title, viewAllHref }: { title: string; viewAllHref: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <Link href={viewAllHref} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
        View all
      </Link>
    </div>
  );
}

async function RecentSection() {
  const { items }: PaginatedResponse<FileListItem> = await apiFetchServer("/files?limit=6");
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title="Recent" viewAllHref="/recent" />
      {items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No files yet"
          description="Create a file to start drawing, alone or with others."
        />
      ) : (
        <FileBrowser files={items} />
      )}
    </section>
  );
}

async function StarredSection() {
  const { items }: PaginatedResponse<FileListItem> = await apiFetchServer("/files/starred?limit=6");
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title="Starred" viewAllHref="/starred" />
      {items.length === 0 ? (
        <EmptyState icon={Star} title="No starred files" description="Files you star will show up here." />
      ) : (
        <FileBrowser files={items} />
      )}
    </section>
  );
}

async function SharedSection() {
  const { items }: PaginatedResponse<SharedFileListItem> = await apiFetchServer("/files/shared?limit=6");
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title="Shared" viewAllHref="/shared" />
      {items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nothing shared with you yet"
          description="Files other people share with you will show up here."
        />
      ) : (
        <FileBrowser files={items} />
      )}
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col gap-8 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
      <HomeSearchBox />
      <Suspense fallback={<FileGridSkeleton />}>
        <RecentSection />
      </Suspense>
      <Suspense fallback={<FileGridSkeleton />}>
        <StarredSection />
      </Suspense>
      <Suspense fallback={<FileGridSkeleton />}>
        <SharedSection />
      </Suspense>
    </main>
  );
}
