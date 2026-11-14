import type { ReactNode } from "react";
import { BrainyDock } from "@/components/child/BrainyDock";

// Learn, Leisure and Gifts show the Brainy dock; the Brainy tab and games don't.
export default function DockedLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <BrainyDock />
      {children}
    </>
  );
}
