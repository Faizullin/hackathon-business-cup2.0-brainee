import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" data-mode="auth" className="mx-auto max-w-xl">
      {children}
    </main>
  );
}
