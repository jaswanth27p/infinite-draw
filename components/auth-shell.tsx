import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

export const authAppearance = {
  variables: {
    colorPrimary: "var(--primary)",
    colorPrimaryForeground: "var(--primary-foreground)",
    colorDanger: "var(--destructive)",
    colorBackground: "var(--card)",
    colorForeground: "var(--card-foreground)",
    colorMuted: "var(--muted)",
    colorMutedForeground: "var(--muted-foreground)",
    colorInput: "var(--background)",
    colorInputForeground: "var(--foreground)",
    colorBorder: "var(--border)",
    colorRing: "var(--ring)",
    fontFamily: "var(--font-sans)",
    borderRadius: "var(--radius)",
  },
  elements: {
    headerTitle: "font-heading",
  },
};

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-8 overflow-hidden p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />
      <div className="relative flex flex-col items-center gap-2">
        <Logo className="text-xl" />
        <p className="max-w-xs text-center text-sm text-muted-foreground">
          A real-time collaborative whiteboard — draw, chat, and talk, together.
        </p>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
