"use client";

import { useViewMode } from "@/hooks/use-view-mode";
import { ViewModeToggle } from "@/components/view-mode-toggle";
import { FileCard } from "@/components/file-card";
import type { FileListItem, SharedFileListItem } from "@/lib/file-types";

interface FileBrowserProps {
  files: (FileListItem | SharedFileListItem)[];
}

export function FileBrowser({ files }: FileBrowserProps) {
  const [view, setView] = useViewMode();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <ViewModeToggle view={view} onChange={setView} />
      </div>
      <div
        className={
          view === "grid"
            ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
            : "flex flex-col gap-2"
        }
      >
        {files.map((file) => (
          <FileCard key={file.id} file={file} view={view} />
        ))}
      </div>
    </div>
  );
}
