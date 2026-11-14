import type { ReactNode } from "react";

// Only a placeholder is exposed until the parent barrier (T-40) and session (T-52) exist.
// Add authorization before rendering family data or accepting parent actions here.
export default function ParentLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" data-mode="parent">
      {children}
    </main>
  );
}
