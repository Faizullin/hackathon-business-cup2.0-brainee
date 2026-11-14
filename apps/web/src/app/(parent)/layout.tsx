import type { ReactNode } from "react";
import { ParentShell } from "@/components/parent/ParentShell";

// Parent mode: PIN barrier (T-40 demo) + three tabs. Parent actions are re-checked on the server.
export default function ParentLayout({ children }: { children: ReactNode }) {
  return <ParentShell>{children}</ParentShell>;
}
