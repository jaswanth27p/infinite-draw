"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Download, MoreVertical, Pencil, Share2, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShareDialog } from "@/components/share-dialog";
import { RenameFileDialog } from "@/components/rename-file-dialog";
import { useApiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface FileOptionsMenuProps {
  fileId: string;
  fileName: string;
  starred: boolean;
  role: "OWNER" | "EDITOR" | "COMMENTER" | "VIEWER";
  className?: string;
}

export function FileOptionsMenu({ fileId, fileName, starred, role, className }: FileOptionsMenuProps) {
  const apiClient = useApiClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [shareOpen, setShareOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const isOwner = role === "OWNER";

  async function handleToggleStar() {
    try {
      await apiClient(`/files/${fileId}/star`, { method: starred ? "DELETE" : "POST" });
    } catch (err) {
      console.error("Failed to toggle star", err);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["file-list"] });
    router.refresh();
  }

  async function handleDownload() {
    let file: { currentData: { elements: unknown[]; appState: Record<string, unknown> } };
    try {
      file = await apiClient(`/files/${fileId}`);
    } catch (err) {
      console.error("Failed to fetch file for download", err);
      return;
    }
    const scene = {
      type: "excalidraw",
      version: 2,
      source: "infinite-draw",
      elements: file.currentData.elements,
      appState: file.currentData.appState,
    };
    const blob = new Blob([JSON.stringify(scene)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.excalidraw`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleMoveToTrash() {
    try {
      await apiClient(`/files/${fileId}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to move file to trash", err);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["file-list"] });
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className={cn("bg-background/80 backdrop-blur-sm hover:bg-background", className)}
              aria-label="File options"
            />
          }
        >
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
          {isOwner && (
            <DropdownMenuItem onClick={() => setShareOpen(true)}>
              <Share2 />
              Share
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleToggleStar}>
            <Star className={cn(starred && "fill-current text-primary")} />
            {starred ? "Unstar" : "Star"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownload}>
            <Download />
            Download
          </DropdownMenuItem>
          {isOwner && (
            <DropdownMenuItem onClick={() => setRenameOpen(true)}>
              <Pencil />
              Rename
            </DropdownMenuItem>
          )}
          {isOwner && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleMoveToTrash}>
                <Trash2 />
                Move to trash
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {isOwner && <ShareDialog fileId={fileId} open={shareOpen} onOpenChange={setShareOpen} />}
      {isOwner && (
        <RenameFileDialog fileId={fileId} currentName={fileName} open={renameOpen} onOpenChange={setRenameOpen} />
      )}
    </>
  );
}
