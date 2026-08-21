"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FileEditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
        <CircleAlert className="size-5 text-destructive" />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Couldn&apos;t load this file</h2>
        <p className="text-sm text-muted-foreground">Something went wrong. Give it another try.</p>
      </div>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
