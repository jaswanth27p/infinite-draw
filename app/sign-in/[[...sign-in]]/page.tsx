import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <span className="text-xl font-semibold tracking-tight">infinite-draw</span>
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" forceRedirectUrl="/home" />
    </div>
  );
}
