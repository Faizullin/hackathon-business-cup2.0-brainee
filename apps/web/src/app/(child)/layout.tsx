import type { ReactNode } from "react";
import { AppFrame } from "@/components/AppFrame";

export default function ChildLayout({ children }: { children: ReactNode }) {
  return (
    <AppFrame>
      <main id="main-content" data-mode="child" tabIndex={-1}>
        {children}
      </main>
    </AppFrame>
  );
}
