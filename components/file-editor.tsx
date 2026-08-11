"use client";

import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import "@excalidraw/excalidraw/index.css";
import { useFileQuery } from "@/hooks/use-file-query";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false },
);

export function FileEditor({ fileId }: { fileId: string }) {
  const { data, isLoading, isError, error } = useFileQuery(fileId);

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center">Loading file…</div>;
  }

  if (isError) {
    if (error instanceof Error && error.message.includes("404")) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="flex-1">
      <Excalidraw
        initialData={{
          elements: data!.currentData.elements as never,
          appState: data!.currentData.appState,
        }}
      />
    </div>
  );
}
