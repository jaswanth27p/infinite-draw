import { SignUp } from "@clerk/nextjs";
import { Logo } from "@/components/logo";

export default function SignUpPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <Logo className="text-xl" />
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" forceRedirectUrl="/home" />
    </div>
  );
}
