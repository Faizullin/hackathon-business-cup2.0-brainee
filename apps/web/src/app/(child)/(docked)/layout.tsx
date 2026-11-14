import type { ReactNode } from "react";
import { BrainyDock } from "@/components/child/BrainyDock";

// Learn, Leisure and Gifts show the Brainy dock; the Brainy tab and games don't.
// iPad landscape (lg): the dock becomes a sticky column beside the content.
export default function DockedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-[max(16px,env(safe-area-inset-top))]">
        <BrainyDock />
      </div>
      <div className="flex min-w-0 flex-col gap-5">{children}</div>
    </div>
  );
}
