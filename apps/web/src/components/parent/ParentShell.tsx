"use client";

import { ChartLine, ClipboardCheck, Gift, LogOut } from "@brainee/ui/components/icons";
import { cn } from "@brainee/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState, ViewTransition } from "react";
import { LearningBoundary } from "@/components/child/LearningBoundary";
import { useLearning } from "@/components/child/LearningProvider";
import { outlineButton } from "@/components/demo/kit";
import { ru } from "@/i18n/ru";

const t = ru.parent;
const TABS = [
  { href: "/analytics", label: t.tabs.analytics, Icon: ChartLine },
  { href: "/tasks", label: t.tabs.tasks, Icon: ClipboardCheck },
  { href: "/rewards", label: t.tabs.rewards, Icon: Gift },
];

function PinGate() {
  const { unlockParent } = useLearning();
  const [pin, setPin] = useState("");
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);
  const press = async (digit: string) => {
    if (busy) return;
    const next = (pin + digit).slice(0, 4);
    setPin(next);
    setWrong(false);
    if (next.length === 4) {
      setBusy(true);
      const ok = await unlockParent(next);
      setBusy(false);
      if (!ok) {
        setWrong(true);
        setPin("");
      }
    }
  };
  return (
    <section className="mx-auto flex max-w-sm flex-col items-center gap-5 rounded-panel border border-border bg-card p-6 text-center">
      <h1>{t.pinTitle}</h1>
      <p className="text-muted-foreground text-sm">{t.pinNote}</p>
      <div aria-live="polite" className="flex gap-3" data-testid="pin-dots">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "size-4 rounded-full border-2 border-foreground transition-colors",
              i < pin.length && "bg-foreground",
              wrong && "animate-[brainee-shake_300ms] border-coral",
            )}
          />
        ))}
      </div>
      {wrong && (
        <p role="alert" className="text-coral text-sm">
          {t.pinWrong}
        </p>
      )}
      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((key) =>
          key === "" ? (
            <span key="blank" />
          ) : (
            <button
              key={key}
              type="button"
              aria-label={key === "⌫" ? t.pinErase : t.pinDigit(key)}
              onClick={() => (key === "⌫" ? setPin((p) => p.slice(0, -1)) : press(key))}
              className="size-16 rounded-2xl bg-secondary font-heading font-semibold text-xl transition-transform duration-(--dur-press) active:scale-90"
            >
              {key}
            </button>
          ),
        )}
      </div>
    </section>
  );
}

function Gate({ children }: { children: ReactNode }) {
  const { snapshot } = useLearning();
  if (!snapshot) return null;
  return snapshot.parentUnlocked ? children : <PinGate />;
}

export function ParentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { snapshot, lockParent } = useLearning();
  return (
    <div className="min-h-dvh overscroll-none">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-30 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-3"
      >
        {ru.app.skipToContent}
      </a>
      <header className="sticky top-0 z-20 border-border border-b bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1180px] items-center gap-3 px-4 pt-[max(8px,env(safe-area-inset-top))] pb-2">
          <p className="font-display font-bold text-coral text-xl">{ru.app.name}</p>
          <nav aria-label={t.tabsLabel} className="ml-4 hidden gap-1 md:flex">
            {TABS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={cn(
                  "rounded-xl px-3 py-2 font-semibold text-sm",
                  pathname === href ? "bg-secondary text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {snapshot?.parentUnlocked ? (
              // ROUTES.md §3.3: hand the device back — locks parent mode, child re-enters via /entry.
              <button
                type="button"
                className={outlineButton}
                onClick={async () => {
                  await lockParent();
                  window.location.assign("/entry");
                }}
              >
                {t.returnToChild}
              </button>
            ) : (
              <Link href="/entry" className={outlineButton}>
                {t.childMode}
              </Link>
            )}
            {snapshot?.parentUnlocked && (
              <button
                type="button"
                onClick={() => lockParent()}
                className={outlineButton}
                aria-label={t.lock}
              >
                <LogOut aria-hidden="true" className="size-4" />
              </button>
            )}
          </div>
        </div>
      </header>
      <LearningBoundary>
        <main
          id="main-content"
          data-mode="parent"
          tabIndex={-1}
          className="mx-auto flex w-full max-w-[1180px] flex-col gap-5 px-4 pt-5 pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-10"
        >
          <Gate>
            <ViewTransition default="page-fade">{children}</ViewTransition>
          </Gate>
        </main>
      </LearningBoundary>
      <nav
        aria-label={t.tabsLabel}
        className="fixed inset-x-0 bottom-0 z-20 border-border border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden"
      >
        <ul className="grid grid-cols-3">
          {TABS.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-0.5 font-semibold text-xs transition-transform duration-(--dur-press) active:scale-95",
                  pathname === href ? "text-coral" : "text-muted-foreground",
                )}
              >
                <Icon aria-hidden="true" className="size-6" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
