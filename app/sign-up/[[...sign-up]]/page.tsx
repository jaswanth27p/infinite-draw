import { SignUp } from "@clerk/nextjs";
import { AuthShell, authAppearance } from "@/components/auth-shell";

export default function SignUpPage() {
  return (
    <AuthShell>
      <SignUp
        appearance={authAppearance}
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        forceRedirectUrl="/home"
      />
    </AuthShell>
  );
}
