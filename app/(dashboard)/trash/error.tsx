"use client";

import { FileGridError } from "@/components/file-grid-error";

export default function TrashError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <FileGridError {...props} message="Couldn't load trash" />;
}
