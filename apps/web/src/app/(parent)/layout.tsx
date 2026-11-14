import type { ReactNode } from "react";
import { AppFrame } from "@/components/AppFrame";

// Only a placeholder is exposed until the parent barrier (T-40) and session (T-52) exist.
// Add authorization before rendering family data or accepting parent actions here.
export default function ParentLayout({ children }: { children: ReactNode }) {
  return (
    <AppFrame>
      <main id="main-content" data-mode="parent" tabIndex={-1}>
        {children}
      </main>
    </AppFrame>
  );
}
