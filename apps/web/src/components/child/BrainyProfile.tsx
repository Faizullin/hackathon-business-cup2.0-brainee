"use client";
import { Brainy } from "@brainee/brainy";
import {
  ABILITY_BODY,
  ACCESSORIES,
  BODY_STATS,
  EARNED_REWARDS,
  learningPracticeGame,
  rewardProgress,
  STAGES,
  stageOf,
} from "@brainee/core";
import { allGames } from "@brainee/games";
import { cn } from "@brainee/ui/lib/utils";
import Link from "next/link";
import { ViewTransition } from "react";
import { Meter, Notice, outlineButton, Panel, primaryButton, useAct } from "@/components/demo/kit";
import { ru } from "@/i18n/ru";
import { useLearning } from "./LearningProvider";

// Brainy tab: big Brainy, stage path, stats, accessory shop and earned rewards (T-38).
export function BrainyProfile() {
  const { snapshot, resting } = useLearning();
  const { run, busy, notice } = useAct();
  if (!snapshot) return null;
  const { stats } = snapshot.progress;
  const { equipped, owned, earned } = snapshot.showcase;
  const stage = stageOf(stats);
  const t = ru.child.brainyPage;
  const suggestion = learningPracticeGame(
    stats,
    allGames.filter((g) => g.minAge <= new Date().getFullYear() - snapshot.child.birthYear),
  );
  const weakest = suggestion
    ? ABILITY_BODY[suggestion.skills.main as keyof typeof ABILITY_BODY]
    : "brain";
  const rewards = snapshot.activity ? rewardProgress(stats, snapshot.activity) : null;
  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:items-start">
      <section className="flex flex-col items-center gap-4 rounded-panel border border-border bg-card p-5 text-center sm:p-8 lg:sticky lg:top-[max(16px,env(safe-area-inset-top))]">
        <h1>{t.title}</h1>
        {resting && (
          <p role="status" className="rounded-xl bg-mint/10 p-3">
            {t.thanks}
          </p>
        )}
        <ViewTransition name="brainy-hero">
          <Brainy stats={stats} equipped={equipped} className="h-auto w-full max-w-[320px]" />
        </ViewTransition>
        <p className="font-heading text-lg font-semibold">{ru.stages[stage.id]}</p>
        {stage.next && (
          <p className="text-muted-foreground">
            {ru.child.dock.toNext(ru.stages[stage.next], stage.pointsToNext)}
          </p>
        )}
        {suggestion && (
          <Link href={`/game/${suggestion.id}`} className={cn(primaryButton, "min-h-12 px-5")}>
            {t.suggest(ru.lab.brainy.statNames[weakest])}
          </Link>
        )}
        <ol className="grid w-full max-w-md grid-cols-5 gap-1.5 text-[10px] leading-tight sm:text-xs">
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
              <span
                className="[overflow-wrap:anywhere]"
                aria-current={i === stage.index ? "step" : undefined}
              >
                {ru.stages[s.id]}
              </span>
            </li>
          ))}
        </ol>
      </section>
      <div className="flex min-w-0 flex-col gap-5">
        <Panel title={t.stats}>
          <dl aria-label={t.stats} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[...BODY_STATS, "resp" as const].map((stat) => (
              <div key={stat} className="flex flex-col gap-1.5 rounded-xl bg-secondary p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="font-semibold">
                    {ru.lab.brainy.statNames[stat]}{" "}
                    <span className="font-normal text-muted-foreground text-xs">
                      {t.trains[stat]}
                    </span>
                  </dt>
                  <dd data-testid={`brainy-stat-${stat}`} className="font-semibold">
                    {stats[stat]}
                  </dd>
                </div>
                <Meter value={stats[stat]} />
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title={t.shop} note={`★ ${snapshot.progress.wallet.stars}`}>
          <Notice notice={notice} />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ACCESSORIES.map((item) => {
              const has = owned.includes(item.id);
              const worn = equipped[item.slot] === item.id;
              return (
                <li
                  key={item.id}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border border-border p-3 text-center",
                    worn && "border-mint bg-mint/5",
                  )}
                >
                  <Brainy
                    stats={stats}
                    equipped={{ ...equipped, [item.slot]: item.id }}
                    label=""
                    className="h-24 w-auto"
                  />
                  <span className="font-semibold text-sm">{ru.accessories[item.id]}</span>
                  {!has ? (
                    <button
                      type="button"
                      disabled={busy}
                      className={primaryButton}
                      onClick={() => run({ type: "buy-accessory", id: item.id })}
                    >
                      {t.buy(item.priceStars)}
                    </button>
                  ) : worn ? (
                    <button
                      type="button"
                      disabled={busy}
                      className={outlineButton}
                      onClick={() => run({ type: "unequip", slot: item.slot })}
                    >
                      {t.remove}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      className={outlineButton}
                      onClick={() => run({ type: "equip", id: item.id })}
                    >
                      {t.wear}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title={t.earned}>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {EARNED_REWARDS.map((reward) => {
              const has = earned.includes(reward);
              return (
                <li
                  key={reward}
                  className={cn(
                    "rounded-xl p-3 text-center text-sm font-semibold",
                    has
                      ? "bg-sun/20"
                      : "border-2 border-border border-dashed text-muted-foreground",
                  )}
                >
                  {t.earnedNames[reward]}
                  {!has && (
                    <span className="block font-normal text-xs">
                      {rewards
                        ? ru.rewardProgress(
                            reward,
                            rewards[reward].value,
                            rewards[reward].target,
                            snapshot.activity?.heroStarted ?? 0,
                          )
                        : t.locked}
                    </span>
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
