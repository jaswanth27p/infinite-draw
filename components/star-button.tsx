"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface StarButtonProps {
  fileId: string;
  starred: boolean;
  className?: string;
}

export function StarButton({ fileId, starred, className }: StarButtonProps) {
  const apiClient = useApiClient();
  const router = useRouter();
  const [optimisticStarred, setOptimisticStarred] = useState(starred);
  const [isPending, startTransition] = useTransition();

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !optimisticStarred;
    setOptimisticStarred(next);
    try {
      await apiClient(`/files/${fileId}/star`, { method: next ? "POST" : "DELETE" });
    } catch {
      setOptimisticStarred(!next);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={handleClick}
      disabled={isPending}
      aria-label={optimisticStarred ? "Unstar" : "Star"}
      className={cn("bg-background/80 backdrop-blur-sm hover:bg-background", className)}
    >
      <Star className={cn("size-4", optimisticStarred && "fill-current text-primary")} />
    </Button>
  );
}
