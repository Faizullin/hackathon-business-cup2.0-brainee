"use client";

import { navigationCounts } from "@brainee/core";
import { ChartLine, ClipboardCheck, Gift, LogOut, Settings } from "@brainee/ui/components/icons";
import { cn } from "@brainee/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState, ViewTransition } from "react";
import { BrandMark } from "@/components/BrandMark";
import { LearningBoundary } from "@/components/child/LearningBoundary";
import { useLearning } from "@/components/child/LearningProvider";
import { outlineButton } from "@/components/demo/kit";
import { NavigationBadge } from "@/components/demo/NavigationBadge";
import { useI18n } from "@/i18n";

function PinGate() {
  const { unlockParent } = useLearning();
  const { t } = useI18n();
  const tp = t.parent;
  const [adult, setAdult] = useState(false);
  const [answer, setAnswer] = useState("");
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
      <h1>{tp.pinTitle}</h1>
      <p className="text-muted-foreground text-sm">{adult ? tp.adultNote : tp.pinNote}</p>
      <button
        type="button"
        className={outlineButton}
        onClick={() => {
          setAdult(!adult);
          setWrong(false);
        }}
      >
        {adult ? tp.usePin : tp.adultTask}
      </button>
      {adult && (
        <form
          className="flex flex-col gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            const ok = await unlockParent(answer, true);
            setBusy(false);
            setWrong(!ok);
          }}
        >
          <label className="flex flex-col gap-2">
            {tp.adultQuestion}
            <input
              aria-label={tp.adultAnswer}
              inputMode="numeric"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="min-h-12 rounded-xl border border-border px-3"
            />
          </label>
          <p className="text-muted-foreground text-sm">{tp.adultHint}</p>
          <button type="submit" disabled={busy} className={outlineButton}>
            {tp.adultSubmit}
          </button>
        </form>
      )}
      <div aria-live="polite" className={adult ? "hidden" : "flex gap-3"} data-testid="pin-dots">
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
          {adult ? tp.adultWrong : tp.pinWrong}
        </p>
      )}
      <div className={adult ? "hidden" : "grid grid-cols-3 gap-3"}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((key) =>
          key === "" ? (
            <span key="blank" />
          ) : (
            <button
              key={key}
              type="button"
              aria-label={key === "⌫" ? tp.pinErase : tp.pinDigit(key)}
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
  const { t } = useI18n();
  const tp = t.parent;
  const tabs = [
    { href: "/analytics", label: tp.tabs.analytics, Icon: ChartLine },
    { href: "/tasks", label: tp.tabs.tasks, Icon: ClipboardCheck },
    { href: "/rewards", label: tp.tabs.rewards, Icon: Gift },
    { href: "/settings", label: tp.tabs.settings, Icon: Settings },
  ];

  const counts = snapshot?.parentUnlocked ? navigationCounts(snapshot.showcase) : null;
  const badge = (href: string) =>
    href === "/tasks"
      ? (counts?.parentTasks ?? 0)
      : href === "/rewards"
        ? (counts?.parentRewards ?? 0)
        : 0;
  return (
    <div className="ui-surface min-h-dvh overscroll-none">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-30 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-3"
      >
        {t.app.skipToContent}
      </a>
      <header className="sticky top-0 z-20 border-border border-b bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1180px] items-center gap-3 px-4 pt-[max(8px,env(safe-area-inset-top))] pb-2">
          <BrandMark name={t.app.name} />
          <nav aria-label={tp.tabsLabel} className="ml-4 hidden gap-1 min-[1000px]:flex">
            {tabs.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-description={badge(href) ? t.notifications(badge(href)) : undefined}
                aria-current={pathname === href ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center rounded-xl px-3 py-2 font-semibold text-sm",
                  pathname === href ? "bg-violet-wash text-accent" : "text-muted-foreground",
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {label}
                  <NavigationBadge count={badge(href)} />
                </span>
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
                {tp.returnToChild}
              </button>
            ) : (
              <Link href="/entry" className={outlineButton}>
                {tp.childMode}
              </Link>
            )}
            {snapshot?.parentUnlocked && (
              <button
                type="button"
                onClick={() => lockParent()}
                className={outlineButton}
                aria-label={tp.lock}
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
          className="mx-auto flex w-full max-w-[1180px] flex-col ui-stack px-(--ui-page-padding) pt-(--ui-page-padding) pb-[calc(96px+env(safe-area-inset-bottom))] min-[1000px]:pb-10"
        >
          <Gate>
            <ViewTransition default="page-fade">{children}</ViewTransition>
          </Gate>
        </main>
      </LearningBoundary>
      <nav
        aria-label={tp.tabsLabel}
        className="fixed inset-x-0 bottom-0 z-20 border-border border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm min-[1000px]:hidden"
      >
        <ul className="grid grid-cols-4">
          {tabs.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-description={badge(href) ? t.notifications(badge(href)) : undefined}
                aria-current={pathname === href ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-0.5 font-semibold text-xs transition-transform duration-(--dur-press) active:scale-95",
                  pathname === href ? "text-accent" : "text-muted-foreground",
                )}
              >
                <Icon aria-hidden="true" className="size-6" />
                <span className="inline-flex items-center gap-1">
                  {label}
                  <NavigationBadge count={badge(href)} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
