import type { ReactNode } from "react";

export default function ChildLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" data-mode="child">
      {children}
    </main>
  );
}
