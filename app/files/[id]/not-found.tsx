import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FileNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <h2 className="text-lg font-semibold">File not found</h2>
      <Button render={<Link href="/files" />}>Back to your files</Button>
    </div>
  );
}
