"use client";
import { EARNED_REWARDS, rewardProgress, STAGES, stageOf } from "@brainee/core";
import { Backpack, BadgeCheck, ShieldCheck, Sprout } from "@brainee/ui/components/icons";
import { Brainy } from "@/components/Brainy";
import { Meter, Panel } from "@/components/demo/kit";
import { useLearning } from "./LearningProvider";
import { childDesignCopy as copy } from "./redesign-copy";
export function PathScreen() {
  const { snapshot } = useLearning();
  if (!snapshot) return null;
  const { stats } = snapshot.progress;
  const stage = stageOf(stats);
  const week = snapshot.activity?.learning ?? snapshot.showcase.analytics.week.learning;
  const max = Math.max(1, ...week);
  const rewards = snapshot.activity ? rewardProgress(stats, snapshot.activity) : null;
  return (
    <div className="lv-in space-y-5">
      <h1>{copy.pathTitle}</h1>
      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className="space-y-5">
          <section className="rounded-stage bg-[#1C1B33] p-5 text-white">
            <h2 className="font-heading text-lg">{copy.week}</h2>
            <p className="mt-2 text-[#CFCDE6]">
              <span className="font-display text-3xl text-pink">
                {Math.round(week.reduce((a, b) => a + b, 0))}
              </span>{" "}
              {copy.minutes}
            </p>
            <ol className="mt-4 grid h-36 grid-cols-7 items-end gap-2">
              {week.map((value, i) => (
                <li
                  key={copy.days[i]}
                  className="flex h-full flex-col items-center justify-end gap-2 text-xs"
                >
                  <span>{Math.round(value)}</span>
                  <span
                    aria-hidden="true"
                    className="w-full rounded-t-lg bg-[#8C76FF]"
                    style={{ height: `${Math.max(3, (value / max) * 85)}px` }}
                  />
                  <span className="text-[#CFCDE6]">{copy.days[i]}</span>
                </li>
              ))}
            </ol>
          </section>
          <ol className="space-y-2">
            {STAGES.map((s, i) => (
              <li
                key={s.id}
                aria-current={i === stage.index ? "step" : undefined}
                className={`flex min-h-24 items-center gap-3 rounded-panel bg-card p-3 ring-1 ${i === stage.index ? "ring-mint" : "ring-border"}`}
              >
                <Brainy
                  label=""
                  stats={{
                    brain: s.min,
                    eyes: s.min,
                    mouth: s.min,
                    arms: s.min,
                    legs: s.min,
                    resp: 0,
                  }}
                  mood={40 + i * 13}
                  className="size-[78px] shrink-0 rounded-full bg-bg"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading">{copy.stages[i]}</h2>
                  <p className="text-sm text-muted-foreground">
                    {s.min}–{(STAGES[i + 1]?.min ?? 101) - 1}
                  </p>
                </div>
                {i === stage.index && (
                  <span className="rounded-full bg-pink px-2 py-1 text-xs font-bold text-[#1C1B33]">
                    {copy.here}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
        <Panel title={copy.badges}>
          <ul className="grid grid-cols-3 gap-3">
            {EARNED_REWARDS.map((id) => {
              const Icon = {
                captainBackpack: Backpack,
                explorerBadge: BadgeCheck,
                ownGarden: Sprout,
                heroCape: ShieldCheck,
              }[id];
              const has = snapshot.showcase.earned.includes(id);
              const p = rewards?.[id];
              return (
                <li
                  key={id}
                  className={`flex flex-col items-center gap-3 rounded-row bg-bg p-3 text-center text-xs ${has ? "" : "opacity-50"}`}
                >
                  <span className="flex size-12 items-center justify-center rounded-row bg-violet-wash font-display text-lg text-mint">
                    <Icon aria-hidden="true" className="size-7" />
                  </span>
                  <span className="font-bold">{copy.rewardNames[id]}</span>
                  {has ? (
                    <span className="font-bold text-mint">{copy.earned}</span>
                  ) : (
                    p && (
                      <>
                        <span>{copy.progress(p.value, p.target)}</span>
                        <span className="w-full">
                          <Meter value={(p.value / p.target) * 100} />
                        </span>
                      </>
                    )
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
