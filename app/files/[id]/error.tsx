"use client";

import { useEffect } from "react";
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
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <h2 className="text-lg font-semibold">Couldn&apos;t load this file</h2>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
