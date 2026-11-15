"use client";

import { type FunGame, funMinutesLeft } from "@brainee/core";
import { useCatalog } from "@brainee/games";
import { Play, Worm } from "@brainee/ui/components/icons";
import { cn } from "@brainee/ui/lib/utils";
import { useEffect, useState } from "react";
import { Chip, Notice, outlineButton, Panel, primaryButton, useAct } from "@/components/demo/kit";
import { useI18n } from "@/i18n";
import { GameThumbnail } from "./GameThumbnail";
import { useLearning } from "./LearningProvider";
import { stoppingCopy } from "./stopping-copy";

const FUN_ICONS = { snake: Worm };

// Leisure tab (T-36): every fun game, Snake and all Explore games (built-in and remote, D-42), is
// bought for ★: 10 minutes or forever. Free science films live on Learn. Only content that exists
// is listed (D-39); a paid Explore game stays listed while its remote catalog is unreachable.
export function LeisureScreen() {
  const { snapshot } = useLearning();
  const { previews } = useCatalog();
  const { run, busy, notice } = useAct();
  const { t: i18n } = useI18n();
  const t = i18n.child.leisure;
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);
  if (!snapshot) return null;
  const stars = snapshot.progress.wallet.stars;
  const age = now.getFullYear() - snapshot.child.birthYear;
  const owned = (g: FunGame) => g.forever || funMinutesLeft(g, now) > 0;
  const fun = snapshot.showcase.fun.filter(
    (g) => g.kind !== "explore" || owned(g) || previews.some((p) => p.id === g.id),
  );
  const buy = (game: FunGame) =>
    !game.forever && (
      <>
        <button
          type="button"
          className={outlineButton}
          disabled={busy || stars < game.priceTimed}
          onClick={() => run({ type: "unlock-fun", gameId: game.id, mode: "timed" })}
        >
          {t.timed(10, game.priceTimed)}
        </button>
        <button
          type="button"
          className={outlineButton}
          disabled={busy || stars < game.priceForever}
          onClick={() => run({ type: "unlock-fun", gameId: game.id, mode: "forever" })}
        >
          {t.forever(game.priceForever)}
        </button>
      </>
    );
  return (
    <>
      <Panel as="h1" title={t.title} note={t.description}>
        <span />
      </Panel>
      <details data-testid="leisure-time" className="rounded-panel bg-card p-4 ring-1 ring-border">
        <summary className="ui-control cursor-pointer font-heading text-lg">
          {stoppingCopy.timeTitle}
        </summary>
        <p className="mb-4 text-sm text-muted-foreground">{stoppingCopy.timeNote}</p>
        <dl className="space-y-2">
          {fun.map((game) => (
            <div
              key={game.id}
              className="flex justify-between gap-3 rounded-row bg-violet-wash p-3 text-sm"
            >
              <dt>{game.title}</dt>
              <dd className="font-semibold text-accent">
                {game.forever
                  ? stoppingCopy.owned
                  : funMinutesLeft(game, now) > 0
                    ? stoppingCopy.minutes(funMinutesLeft(game, now))
                    : stoppingCopy.noTime}
              </dd>
            </div>
          ))}
        </dl>
      </details>
      <Notice notice={notice} />
      <Panel title={t.shop} note={`★ ${stars}`}>
        <ul className="ui-grid grid sm:grid-cols-2" data-testid="fun-shop">
          {fun.map((game) => {
            const Icon = FUN_ICONS[game.icon as keyof typeof FUN_ICONS] ?? Play;
            const left = funMinutesLeft(game, now);
            const tooYoung = game.kind === "explore" && age < (game.minAge ?? 0);
            return (
              <li
                key={game.id}
                data-testid={`fun-game-${game.id}`}
                aria-disabled={tooYoung || undefined}
                className="ui-game-card flex flex-col gap-3"
              >
                {game.thumbnail ? (
                  <GameThumbnail src={game.thumbnail} locked={tooYoung} />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gain-wash">
                    <Icon aria-hidden="true" className="size-6 text-sky" />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block font-semibold">{game.title}</span>
                  <span className="text-muted-foreground text-xs">
                    {tooYoung ? i18n.learn.lockedAge(game.minAge ?? 0) : game.skill}
                  </span>
                </span>
                {tooYoung ? null : game.forever || left > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone="mint">{game.forever ? t.owned : t.minutesLeft(left)}</Chip>
                    <button
                      type="button"
                      className={cn(primaryButton, "ml-auto")}
                      onClick={() => window.location.assign(`/fun/${game.id}`)}
                    >
                      {t.play}
                    </button>
                    {buy(game)}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">{buy(game)}</div>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>
    </>
  );
}
