import type { ReactNode } from "react";
import { AppFrame } from "@/components/AppFrame";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AppFrame className="max-w-xl">
      <main id="main-content" data-mode="auth" tabIndex={-1}>
        {children}
      </main>
    </AppFrame>
  );
}
