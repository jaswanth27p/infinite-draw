import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <span className="text-xl font-semibold tracking-tight">infinite-draw</span>
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" forceRedirectUrl="/home" />
    </div>
  );
}
