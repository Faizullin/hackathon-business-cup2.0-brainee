"use client";
import { stageOf } from "@brainee/core";
import { StarIcon, SunIcon } from "@brainee/ui/components/child-icons";
import Link from "next/link";
import { ViewTransition } from "react";
import { Brainy } from "@/components/Brainy";
import { useI18n } from "@/i18n";
import { useLearning } from "./LearningProvider";
import { childDesignCopy as copy } from "./redesign-copy";
export function HeroBrainCard({ title, dock = false }: { title?: string; dock?: boolean }) {
  const { snapshot, resting } = useLearning();
  const { t } = useI18n();
  if (!snapshot) return null;
  const { stats, mood, wallet } = snapshot.progress;
  const stage = stageOf(stats);
  const ring = stage.index === 4 ? "#FF9EC2" : "#B9A8FF";
  return (
    <section
      data-testid={dock ? "brainy-dock" : "brainy-hero"}
      className="flex flex-col items-center gap-4 rounded-stage bg-[#1C1B33] p-5 text-center text-white shadow-[0_24px_40px_-24px_rgba(28,27,51,.55)]"
    >
      {title && <h1 className="text-white">{title}</h1>}
      {resting && (
        <p role="status" className="rounded-row bg-night p-3 text-sm">
          {t.child.brainyPage.thanks}
        </p>
      )}
      <Link
        href="/brainy"
        aria-label={t.child.dock.openBrainy}
        className="lv-glow flex size-[188px] items-center justify-center rounded-full bg-[#F2F1FA]"
        style={{ "--ring": ring } as React.CSSProperties}
      >
        <ViewTransition name="brainy-hero">
          <Brainy
            stats={stats}
            mood={mood}
            earned={snapshot.showcase.earned}
            equipped={snapshot.showcase.equipped}
            animate
            label={dock ? "" : undefined}
            className="h-auto w-[200px] max-w-none"
          />
        </ViewTransition>
      </Link>
      <div>
        <span className="font-display text-5xl" style={{ color: ring }}>
          {mood}
        </span>
        <span className="ml-2 text-[#CFCDE6]">/ 100</span>
        <p className="mt-1 text-xs text-[#CFCDE6]">{copy.energy}</p>
      </div>
      <p className="font-heading text-lg">{t.stages[stage.id]}</p>
      <div aria-hidden="true" className="grid w-full grid-cols-10 gap-1">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <span
            key={`segment-${i}`}
            className="lv-seg h-2.5 rounded-sm"
            style={{ background: i < Math.round(stage.progress * 10) ? ring : "#4A4570" }}
          />
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2 text-xs font-bold">
        <span className="rounded-full bg-[#5A3FE0] px-3 py-1.5">
          {copy.today(snapshot.activity?.learningStarsToday ?? 0)}
        </span>
        <span className="rounded-full bg-night px-3 py-1.5 text-[#CFCDE6]">
          {stage.next ? t.child.dock.toNext(t.stages[stage.next], stage.pointsToNext) : copy.grown}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <span data-testid="wallet-stars" className="flex items-center gap-1">
          <StarIcon className="size-5" />
          <span className="font-display">{wallet.stars}</span>
        </span>
        <span className="flex items-center gap-1">
          <SunIcon className="size-5" />
          <span className="font-display">{wallet.suns}</span>
        </span>
        <Link href="/gifts" className="flex min-h-14 items-center rounded-full bg-night px-3">
          {t.child.dock.goal(snapshot.showcase.weekGoal.earned, snapshot.showcase.weekGoal.target)}
        </Link>
      </div>
    </section>
  );
}
