"use client";

import type { ShowcaseAction } from "@brainee/core";
import { cn } from "@brainee/ui/lib/utils";
import { type ReactNode, useCallback, useState } from "react";
import { useLearning } from "@/components/child/LearningProvider";
import { ru } from "@/i18n/ru";

export function Panel({
  title,
  note,
  children,
  className,
  action,
  as: Heading = "h2",
}: {
  title?: ReactNode;
  note?: ReactNode;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  as?: "h1" | "h2";
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-panel border border-border bg-card p-4 sm:p-5",
        className,
      )}
    >
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            {title && (
              <Heading className={Heading === "h2" ? "font-heading text-lg font-semibold" : ""}>
                {title}
              </Heading>
            )}
            {note && <p className="text-muted-foreground text-sm">{note}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Chip({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: "mint" | "sun" | "sky" | "coral";
}) {
  const tones = {
    mint: "bg-mint/15 text-foreground",
    sun: "bg-sun/20 text-foreground",
    sky: "bg-sky/15 text-foreground",
    coral: "bg-coral/15 text-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium text-xs",
        tone ? tones[tone] : "bg-secondary",
      )}
    >
      {children}
    </span>
  );
}

export function Meter({
  value,
  tone = "bg-mint",
  marker,
}: {
  value: number;
  tone?: string;
  marker?: number;
}) {
  return (
    <span aria-hidden="true" className="relative block h-2 overflow-hidden rounded-full bg-line">
      <span
        className={cn("block h-full rounded-full transition-[width] duration-500", tone)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
      {marker !== undefined && (
        <span
          className="absolute top-0 h-full w-0.5 bg-foreground"
          style={{ left: `${marker}%` }}
        />
      )}
    </span>
  );
}

/** Runs a demo action, keeps a short status line, and exposes `busy` for buttons. */
export function useAct() {
  const { act } = useLearning();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const run = useCallback(
    async (action: ShowcaseAction, success?: string) => {
      setBusy(true);
      try {
        const error = await act(action);
        if (error)
          setNotice({ text: ru.actionErrors[error] ?? ru.child.sync.updateError, ok: false });
        else if (success) setNotice({ text: success, ok: true });
        else setNotice(null);
        return error === null;
      } finally {
        setBusy(false);
      }
    },
    [act],
  );
  return { run, busy, notice };
}

export function Notice({ notice }: { notice: { text: string; ok: boolean } | null }) {
  if (!notice) return null;
  return (
    <p
      role={notice.ok ? "status" : "alert"}
      className={cn("rounded-xl p-3 text-sm font-medium", notice.ok ? "bg-mint/15" : "bg-coral/15")}
    >
      {notice.text}
    </p>
  );
}

export const smallButton =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold transition-transform duration-(--dur-press) active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
export const primaryButton = `${smallButton} bg-primary text-primary-foreground`;
export const coralButton = `${smallButton} bg-coral text-white`;
export const outlineButton = `${smallButton} border border-border bg-card`;
