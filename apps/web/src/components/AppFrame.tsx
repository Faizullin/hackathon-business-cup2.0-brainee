import { cn } from "@brainee/ui/lib/utils";
import type { ReactNode } from "react";
import { ru } from "@/i18n/ru";

// Route layouts opt into chrome; fullscreen games can use their own shell in T-30.
export function AppFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto min-h-dvh w-full max-w-[1180px] overscroll-none pt-5 pr-[max(16px,env(safe-area-inset-right))] pb-[max(56px,env(safe-area-inset-bottom))] pl-[max(16px,env(safe-area-inset-left))]",
        className,
      )}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-10 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-3"
      >
        {ru.app.skipToContent}
      </a>
      <header className="mb-6 border-line border-b pb-4">
        <p className="font-display text-xl font-bold text-coral">{ru.app.name}</p>
      </header>
      {children}
    </div>
  );
}
