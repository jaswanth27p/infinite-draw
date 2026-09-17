"use client";

import { useState } from "react";
import { Search, Users } from "lucide-react";
import { VirtualizedFileList } from "@/components/virtualized-file-list";
import { FileCard } from "@/components/file-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSharedFiles } from "@/hooks/use-shared-files";
import { useFileSearch } from "@/hooks/use-file-search";

export default function SharedPage() {
  const { query, setQuery, debouncedQuery } = useFileSearch();
  const [role, setRole] = useState<"VIEWER" | "COMMENTER" | "EDITOR" | undefined>(undefined);
  const listQuery = useSharedFiles(debouncedQuery, role);

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <VirtualizedFileList
        query={listQuery}
        emptyIcon={Users}
        emptyTitle="Nothing shared with you yet"
        emptyDescription="Files other people share with you will show up here."
        errorMessage="Couldn't load shared files"
        renderCard={(file, view) => <FileCard file={file} view={view} />}
        toolbar={
          <div className="flex items-center gap-2">
            <div className="relative max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search shared files…"
                className="pl-8"
              />
            </div>
            <Select
              value={role ?? "ALL"}
              onValueChange={(value) => setRole(value === "ALL" ? undefined : (value as "VIEWER" | "COMMENTER" | "EDITOR"))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All roles</SelectItem>
                <SelectItem value="VIEWER">Viewer</SelectItem>
                <SelectItem value="COMMENTER">Commenter</SelectItem>
                <SelectItem value="EDITOR">Editor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </main>
  );
}
