"use client";

import { FileGridError } from "@/components/file-grid-error";

export default function HomeError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <FileGridError {...props} message="Couldn't load your files" />;
}
