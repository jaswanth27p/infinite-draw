import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    redirect("/files");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <div className="flex max-w-xl flex-col items-center gap-4">
        <h1 className="text-4xl font-semibold tracking-tight">infinite-draw</h1>
        <p className="text-lg text-muted-foreground">
          A real-time collaborative whiteboard. Draw together, chat per file, talk over voice,
          and turn a prompt into a diagram with AI — all in one canvas.
        </p>
      </div>
      <SignInButton mode="modal" forceRedirectUrl="/files" signUpForceRedirectUrl="/files">
        <Button size="lg">Get started</Button>
      </SignInButton>
    </div>
  );
}
