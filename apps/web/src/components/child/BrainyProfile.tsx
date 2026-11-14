"use client";
import { Brainy } from "@brainee/brainy";
import { BODY_STATS, STAGES, stageOf } from "@brainee/core";
import { ru } from "@/i18n/ru";
import { demoChild } from "@/lib/demo-child";
import { useDemoProgress } from "./DemoProgressProvider";

// Big Brainy + stage path. Accessory shop and stats come with T-38.
export function BrainyProfile() {
  const {
    progress: { stats },
    resting,
  } = useDemoProgress();
  const { equipped } = demoChild;
  const stage = stageOf(stats);
  return (
    <section className="flex flex-col items-center gap-4 rounded-panel border border-border bg-card p-5 text-center sm:p-8">
      <h1>{ru.child.brainyPage.title}</h1>
      {resting && (
        <p role="status" className="rounded-xl bg-mint/10 p-3">
          {ru.child.brainyPage.thanks}
        </p>
      )}
      <Brainy stats={stats} equipped={equipped} className="h-auto w-full max-w-[320px]" />
      <p className="font-heading text-lg font-semibold">{ru.stages[stage.id]}</p>
      {stage.next && (
        <p className="text-muted-foreground">
          {ru.child.dock.toNext(ru.stages[stage.next], stage.pointsToNext)}
        </p>
      )}
      <dl
        aria-label={ru.child.brainyPage.stats}
        className="flex flex-wrap justify-center gap-3 text-sm"
      >
        {BODY_STATS.map((stat) => (
          <div key={stat} className="rounded-xl bg-secondary px-3 py-2">
            <dt>{ru.lab.brainy.statNames[stat]}</dt>
            <dd data-testid={`brainy-stat-${stat}`} className="font-semibold">
              {stats[stat]}
            </dd>
          </div>
        ))}
      </dl>
      <ol className="grid w-full max-w-md grid-cols-5 gap-1.5 text-xs">
        {STAGES.map((s, i) => (
          <li key={s.id} className="flex flex-col gap-1">
            <span className="h-2 overflow-hidden rounded-full bg-line">
              <span
                className="block h-full bg-mint"
                style={{
                  width: `${i < stage.index ? 100 : i === stage.index ? Math.round(stage.progress * 100) : 0}%`,
                }}
              />
            </span>
            <span aria-current={i === stage.index ? "step" : undefined}>{ru.stages[s.id]}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
