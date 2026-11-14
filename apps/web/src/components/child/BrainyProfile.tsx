"use client";
import { ABILITY_BODY, ACCESSORIES, BODY_STATS, learningPracticeGame } from "@brainee/core";
import { allGames } from "@brainee/games";
import { cn } from "@brainee/ui/lib/utils";
import Link from "next/link";

import { Brainy } from "@/components/Brainy";
import { Meter, Notice, outlineButton, Panel, primaryButton, useAct } from "@/components/demo/kit";
import { useI18n } from "@/i18n";
import { HeroBrainCard } from "./HeroBrainCard";
import { useLearning } from "./LearningProvider";

// Brainy tab: big Brainy, stage path, stats, accessory shop and earned rewards (T-38).
export function BrainyProfile() {
  const { snapshot } = useLearning();
  const { run, busy, notice } = useAct();
  const { t: i18n } = useI18n();
  if (!snapshot) return null;
  const { stats } = snapshot.progress;
  const { equipped, owned } = snapshot.showcase;
  const t = i18n.child.brainyPage;
  const suggestion = learningPracticeGame(
    stats,
    allGames.filter((g) => g.minAge <= new Date().getFullYear() - snapshot.child.birthYear),
  );
  const weakest = suggestion
    ? ABILITY_BODY[suggestion.skills.main as keyof typeof ABILITY_BODY]
    : "brain";
  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:items-start">
      <div className="space-y-4 lg:sticky lg:top-5">
        <HeroBrainCard title={t.title} />
        {suggestion && (
          <Link href={`/game/${suggestion.id}`} className={cn(primaryButton, "min-h-14 w-full")}>
            {t.suggest(i18n.lab.brainy.statNames[weakest])}
          </Link>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-5">
        <Panel title={t.stats}>
          <dl aria-label={t.stats} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[...BODY_STATS, "resp" as const].map((stat, i) => (
              <div
                key={stat}
                className="flex flex-col gap-1.5 bg-card p-3 ring-1 ring-border"
                style={{ borderRadius: i % 2 ? "8px 22px 8px 8px" : "22px 8px 8px 8px" }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="font-semibold">
                    {i18n.lab.brainy.statNames[stat]}{" "}
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
                  <span className="font-semibold text-sm">{i18n.accessories[item.id]}</span>
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
      </div>
    </div>
  );
}
