"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileGridErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  message: string;
}

export function FileGridError({ error, reset, message }: FileGridErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
        <CircleAlert className="size-5 text-destructive" />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{message}</h2>
        <p className="text-sm text-muted-foreground">Something went wrong. Give it another try.</p>
      </div>
      <Button onClick={() => reset()}>Try again</Button>
    </main>
  );
}
