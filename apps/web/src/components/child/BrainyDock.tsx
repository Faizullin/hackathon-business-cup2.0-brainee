"use client";

import { stageOf } from "@brainee/core";
import { StarIcon, SunIcon } from "@brainee/ui/components/child-icons";
import Link from "next/link";
import { ViewTransition } from "react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Brainy } from "@/components/Brainy";
import { useI18n } from "@/i18n";
import { useLearning } from "./LearningProvider";

// Top dock on Learn / Leisure / Gifts (docs/product/screens.md#brainy-dock-every-child-screen).
export function BrainyDock() {
  const { snapshot } = useLearning();
  const { t } = useI18n();
  if (!snapshot) return null;
  const { stats, wallet, mood } = snapshot.progress;
  const { equipped, weekGoal } = snapshot.showcase;
  const stage = stageOf(stats);
  const td = t.child.dock;
  return (
    <section
      data-testid="brainy-dock"
      aria-label={td.label}
      className="flex items-center gap-3 rounded-panel border border-border bg-card p-3 sm:gap-5 sm:p-4 lg:flex-col lg:items-stretch lg:gap-4 lg:p-5"
    >
      <Link
        href="/brainy"
        aria-label={td.openBrainy}
        className="shrink-0 rounded-2xl transition-transform duration-(--dur-press) active:scale-95 lg:self-center"
      >
        <ViewTransition name="brainy-hero">
          <Brainy
            stats={stats}
            equipped={equipped}
            label=""
            className="brainy-idle h-24 w-auto sm:h-[136px] lg:h-44"
          />
        </ViewTransition>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-secondary px-3 py-1 font-semibold text-sm">
            {t.stages[stage.id]}
          </span>
          {stage.next && (
            <span className="text-muted-foreground text-xs">
              {td.toNext(t.stages[stage.next], stage.pointsToNext)}
            </span>
          )}
        </div>
        <div>
          <div className="flex justify-between font-medium text-xs">
            <span>{td.mood}</span>
            <span>{mood}%</span>
          </div>
          <div aria-hidden="true" className="mt-1 h-2 overflow-hidden rounded-full bg-line">
            <span className="block h-full rounded-full bg-mint" style={{ width: `${mood}%` }} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            data-testid="wallet-stars"
            className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 font-semibold"
          >
            <StarIcon className="size-4" />
            <AnimatedNumber value={wallet.stars} />
            <span className="sr-only">{td.stars}</span>
          </span>
          <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 font-semibold">
            <SunIcon className="size-4" />
            <AnimatedNumber value={wallet.suns} />
            <span className="sr-only">{td.suns}</span>
          </span>
          <Link
            href="/gifts"
            className="flex min-h-9 items-center gap-1 rounded-full border border-border px-3 font-semibold text-sm transition-transform duration-(--dur-press) active:scale-95"
          >
            {td.goal(weekGoal.earned, weekGoal.target)}
            <SunIcon className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
