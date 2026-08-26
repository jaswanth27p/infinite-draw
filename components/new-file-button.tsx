"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApiClient } from "@/lib/api-client";

export function NewFileButton() {
  const router = useRouter();
  const apiClient = useApiClient();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      const file = await apiClient("/files", { method: "POST" });
      router.push(`/files/${file.id}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={pending} className="w-full">
      <Plus className="size-4" />
      {pending ? "Creating…" : "New file"}
    </Button>
  );
}
