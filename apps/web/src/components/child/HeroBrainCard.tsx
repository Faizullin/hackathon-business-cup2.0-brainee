"use client";
import { stageOf } from "@brainee/core";
import { StarIcon, SunIcon } from "@brainee/ui/components/child-icons";
import { cn } from "@brainee/ui/lib/utils";
import Link from "next/link";
import { type CSSProperties, ViewTransition } from "react";
import { Brainy } from "@/components/Brainy";
import { useI18n } from "@/i18n";
import { useLearning } from "./LearningProvider";
import { childDesignCopy as copy } from "./redesign-copy";
export function HeroBrainCard({
  title,
  dock = false,
  compact = false,
}: {
  title?: string;
  dock?: boolean;
  compact?: boolean;
}) {
  const { snapshot, resting } = useLearning();
  const { t } = useI18n();
  if (!snapshot) return null;
  const { stats, mood, wallet } = snapshot.progress;
  const stage = stageOf(stats);
  const ring = stage.index === 4 ? "#FF9EC2" : "#B9A8FF";
  const across = compact ? "col-span-2" : "";
  return (
    <section
      data-testid={dock ? "brainy-dock" : "brainy-hero"}
      data-compact={compact}
      className={cn(
        "rounded-stage bg-[#1C1B33] text-white shadow-[0_24px_40px_-24px_rgba(28,27,51,.55)]",
        compact
          ? "grid grid-cols-[80px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 p-4"
          : "flex flex-col items-center gap-4 p-5 text-center",
      )}
    >
      {title && <h1 className="text-white">{title}</h1>}
      {resting && (
        <p role="status" className={cn(across, "rounded-row bg-night p-3 text-sm")}>
          {t.child.brainyPage.thanks}
        </p>
      )}
      <Link
        href="/brainy"
        aria-label={t.child.dock.openBrainy}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-[#F2F1FA]",
          compact ? "size-20" : "lv-glow size-[188px]",
        )}
        style={{ "--ring": ring } as CSSProperties}
      >
        <ViewTransition name="brainy-hero">
          <Brainy
            stats={stats}
            mood={mood}
            earned={snapshot.showcase.earned}
            equipped={snapshot.showcase.equipped}
            animate
            label={dock ? "" : undefined}
            className={cn("h-auto max-w-none", compact ? "w-[94px]" : "w-[200px]")}
          />
        </ViewTransition>
      </Link>
      <div>
        <span
          className={cn("font-display", compact ? "text-3xl" : "text-5xl")}
          style={{ color: ring }}
        >
          {mood}
        </span>
        <span className="ml-1 text-xs text-[#CFCDE6]">/ 100 {copy.energy}</span>
        <p className="mt-1 font-heading text-base">{t.stages[stage.id]}</p>
      </div>
      <div aria-hidden="true" className={cn(across, "grid w-full grid-cols-10 gap-1")}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <span
            key={i}
            className="lv-seg h-2 rounded-sm"
            style={{ background: i < Math.round(stage.progress * 10) ? ring : "#4A4570" }}
          />
        ))}
      </div>
      <div
        className={cn(
          across,
          "flex flex-wrap gap-2 text-xs font-bold",
          !compact && "justify-center",
        )}
      >
        <span className="rounded-full bg-[#5A3FE0] px-2.5 py-1.5">
          {copy.today(snapshot.activity?.learningStarsToday ?? 0)}
        </span>
        <span className="rounded-full bg-night px-2.5 py-1.5 text-[#CFCDE6]">
          {stage.next
            ? copy.toNext(stage.pointsToNext, copy.stages[stage.index + 1] ?? stage.next)
            : copy.grown}
        </span>
      </div>
      <div
        className={cn(
          across,
          "flex w-full flex-wrap items-center gap-3 text-sm",
          !compact && "justify-center",
        )}
      >
        <span data-testid="wallet-stars" className="flex items-center gap-1">
          <StarIcon className="size-4" />
          <span className="font-display">{wallet.stars}</span>
        </span>
        <span className="flex items-center gap-1">
          <SunIcon className="size-4" />
          <span className="font-display">{wallet.suns}</span>
        </span>
        <Link
          href="/gifts"
          className="ml-auto flex min-h-14 items-center gap-1.5 rounded-row bg-night px-2.5 text-xs"
        >
          <SunIcon className="size-4" />
          <span>
            <span className="block text-[#CFCDE6]">{copy.goal}</span>
            {t.child.dock.goal(
              snapshot.showcase.weekGoal.earned,
              snapshot.showcase.weekGoal.target,
            )}
          </span>
        </Link>
      </div>
    </section>
  );
}
