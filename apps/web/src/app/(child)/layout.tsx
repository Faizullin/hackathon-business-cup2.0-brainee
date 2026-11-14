import { type ReactNode, ViewTransition } from "react";
import { LearningBoundary } from "@/components/child/LearningBoundary";
import { TabBar } from "@/components/child/TabBar";
import { ru } from "@/i18n/ru";

// Child app shell: content + persistent bottom tab bar. Fullscreen games use the sibling (game) group.
export default function ChildLayout({ children }: { children: ReactNode }) {
  return (
    <LearningBoundary>
      <div className="min-h-dvh overscroll-none">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-30 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-3"
        >
          {ru.app.skipToContent}
        </a>
        <main
          id="main-content"
          data-mode="child"
          tabIndex={-1}
          className="mx-auto flex w-full max-w-[1180px] flex-col gap-5 pt-[max(16px,env(safe-area-inset-top))] pr-[max(16px,env(safe-area-inset-right))] pb-[calc(96px+env(safe-area-inset-bottom))] pl-[max(16px,env(safe-area-inset-left))]"
        >
          <ViewTransition default="page-fade">{children}</ViewTransition>
        </main>
        <TabBar />
      </div>
    </LearningBoundary>
  );
}
