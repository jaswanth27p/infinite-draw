import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/components/logo";

export default function SignInPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <Logo className="text-xl" />
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" forceRedirectUrl="/home" />
    </div>
  );
}
