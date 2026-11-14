"use client";
import { type ReactNode, useEffect, useId, useRef } from "react";
import { Button } from "./button";
import { ArrowLeft, ArrowRight } from "./icons";
export function StepPage({
  step,
  total,
  chapter,
  title,
  body,
  art,
  children,
  onBack,
  onContinue,
  continueLabel,
  backLabel,
  progressLabel,
  disabled = false,
}: {
  step: string;
  total: { current: number; count: number };
  chapter: string;
  title: string;
  body?: ReactNode;
  art?: ReactNode;
  children?: ReactNode;
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel: string;
  backLabel: string;
  progressLabel: string;
  disabled?: boolean;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const id = useId();
  useEffect(() => {
    if (step) heading.current?.focus({ preventScroll: true });
  }, [step]);
  return (
    <section
      aria-labelledby={id}
      className="mx-auto flex min-h-[calc(100dvh-180px)] w-full max-w-5xl flex-col gap-5 py-4"
    >
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          disabled={!onBack}
          aria-label={backLabel}
        >
          <ArrowLeft aria-hidden="true" />
        </Button>
        <progress
          className="h-1.5 min-w-12 flex-1 appearance-none overflow-hidden rounded-full bg-surface-2 [&::-webkit-progress-bar]:bg-surface-2 [&::-webkit-progress-value]:bg-mint [&::-moz-progress-bar]:bg-mint"
          aria-label={progressLabel}
          value={total.current}
          max={total.count}
        />
        <span className="text-right font-semibold text-muted-foreground text-xs">{chapter}</span>
      </div>
      <div key={step} className="lv-in grid flex-1 gap-5 lg:grid-cols-2 lg:items-center lg:gap-10">
        {art && (
          <div
            data-testid="step-art"
            className="flex min-w-0 items-center justify-center rounded-stage bg-violet-wash p-4 lg:col-start-1 lg:row-span-2 lg:min-h-96"
          >
            {art}
          </div>
        )}
        <div
          className={
            art
              ? "flex min-w-0 flex-col gap-5 lg:col-start-2"
              : "flex min-w-0 flex-col gap-5 lg:col-span-2"
          }
        >
          <header className="space-y-3">
            <h1 ref={heading} id={id} tabIndex={-1} className="outline-none">
              {title}
            </h1>
            {body && <div className="text-muted-foreground">{body}</div>}
          </header>
          {children}
        </div>
      </div>
      {onContinue && (
        <footer className="sticky bottom-0 z-10 mt-auto bg-bg/95 py-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:ml-auto lg:w-[calc(50%-20px)]">
          <Button className="lv-press w-full" size="child" onClick={onContinue} disabled={disabled}>
            {continueLabel}
            <ArrowRight aria-hidden="true" />
          </Button>
        </footer>
      )}
    </section>
  );
}
