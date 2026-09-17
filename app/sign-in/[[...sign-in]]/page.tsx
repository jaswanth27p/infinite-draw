import { SignIn } from "@clerk/nextjs";
import { AuthShell, authAppearance } from "@/components/auth-shell";

export default function SignInPage() {
  return (
    <AuthShell>
      <SignIn
        appearance={authAppearance}
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        forceRedirectUrl="/home"
      />
    </AuthShell>
  );
}
