"use client";

import { type ReactNode, ViewTransition } from "react";
import { LearningBoundary } from "@/components/child/LearningBoundary";
import { ParentEntry } from "@/components/child/ParentEntry";
import { TabBar } from "@/components/child/TabBar";
import { useI18n } from "@/i18n";

// Child app shell: content + persistent tab bar (bottom on phones, left rail in iPad landscape).
// Fullscreen games use the sibling (game) group.
export default function ChildLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <LearningBoundary>
      <div className="min-h-dvh overscroll-none">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-30 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-3"
        >
          {t.app.skipToContent}
        </a>
        <main
          id="main-content"
          data-mode="child"
          tabIndex={-1}
          className="mx-auto flex w-full max-w-[1180px] flex-col gap-5 pt-[max(16px,env(safe-area-inset-top))] pr-[max(20px,env(safe-area-inset-right))] pb-[calc(132px+env(safe-area-inset-bottom))] pl-[max(20px,env(safe-area-inset-left))] lg:max-w-none lg:pb-[max(24px,env(safe-area-inset-bottom))] lg:pl-[calc(120px+env(safe-area-inset-left))] xl:pr-8"
        >
          <p
            data-testid="rotate-hint"
            className="hidden rounded-xl bg-sky/10 p-3 text-center font-medium text-sm [@media(min-width:700px)_and_(orientation:portrait)]:block"
          >
            {t.child.rotateHint}
          </p>
          <ParentEntry />
          <ViewTransition default="page-fade">{children}</ViewTransition>
        </main>
        <TabBar />
      </div>
    </LearningBoundary>
  );
}
