import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PenTool, MessagesSquare, Mic, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: PenTool,
    title: "Real-time drawing",
    description: "Everyone's cursor, edits, and selections sync live on the same canvas.",
  },
  {
    icon: MessagesSquare,
    title: "Per-file chat",
    description: "Talk through a diagram without leaving it — chat is scoped to each file.",
  },
  {
    icon: Mic,
    title: "Voice chat",
    description: "Jump on a call with anyone else in the file, right from the toolbar.",
  },
  {
    icon: Sparkles,
    title: "AI Diagram Assist",
    description: "Describe a diagram, or ask AI to change your selection, in plain English.",
  },
];

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    redirect("/home");
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-16 px-6 py-24">
      <div className="flex max-w-xl flex-col items-center gap-4 text-center">
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          Real-time collaborative whiteboard
        </span>
        <h1 className="text-4xl font-semibold tracking-tight">infinite-draw</h1>
        <p className="text-lg text-muted-foreground">
          Draw together, chat per file, talk over voice, and turn a prompt into a diagram with
          AI — all in one canvas.
        </p>
        <Link href="/sign-up" className={cn(buttonVariants({ size: "lg" }), "mt-2")}>
          Get started
        </Link>
      </div>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <Card key={title}>
            <CardHeader>
              <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-5" />
              </div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
