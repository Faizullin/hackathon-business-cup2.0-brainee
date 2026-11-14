import { type ReactNode, ViewTransition } from "react";

// Fullscreen play: no dock, no tab bar (docs/dev/ui.md#app-shell-route-group-layouts-own-the-chrome).
export default function GameLayout({ children }: { children: ReactNode }) {
  return (
    <main
      id="main-content"
      data-mode="game"
      className="flex min-h-dvh flex-col overscroll-none pt-[max(8px,env(safe-area-inset-top))] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]"
    >
      <ViewTransition default="page-slide">{children}</ViewTransition>
    </main>
  );
}
