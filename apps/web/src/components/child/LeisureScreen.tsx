"use client";

import { funMinutesLeft } from "@brainee/core";
import { Play, Worm } from "@brainee/ui/components/icons";
import { cn } from "@brainee/ui/lib/utils";
import { useEffect, useState } from "react";
import { Chip, Notice, outlineButton, Panel, primaryButton, useAct } from "@/components/demo/kit";
import { useI18n } from "@/i18n";
import { useLearning } from "./LearningProvider";

const FUN_ICONS = { snake: Worm };
/** Only fun games with a real player are listed; catalog entries without content stay hidden. */
const PLAYABLE_FUN = new Set(["snake"]);

// Leisure tab (T-36): shop of playable fun games for ★.
export function LeisureScreen() {
  const { snapshot } = useLearning();
  const { run, busy, notice } = useAct();
  const { t: i18n } = useI18n();
  const t = i18n.child.leisure;
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);
  if (!snapshot) return null;
  const fun = snapshot.showcase.fun.filter((game) => PLAYABLE_FUN.has(game.id));
  const stars = snapshot.progress.wallet.stars;
  return (
    <>
      <Panel as="h1" title={t.title} note={t.description}>
        <span />
      </Panel>
      <Notice notice={notice} />
      <Panel title={t.shop} note={`★ ${stars}`}>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fun.map((game) => {
            const Icon = FUN_ICONS[game.icon as keyof typeof FUN_ICONS] ?? Play;
            const left = funMinutesLeft(game, now);
            return (
              <li key={game.id} className="flex flex-col gap-3 rounded-xl border border-border p-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-sky/15">
                    <Icon aria-hidden="true" className="size-6 text-sky" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{game.title}</span>
                    <span className="text-muted-foreground text-xs">{game.skill}</span>
                  </span>
                </div>
                {game.forever || left > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone="mint">{game.forever ? t.owned : t.minutesLeft(left)}</Chip>
                    <button
                      type="button"
                      className={cn(primaryButton, "ml-auto")}
                      onClick={() => window.location.assign(`/fun/${game.id}`)}
                    >
                      {t.play}
                    </button>
                    {!game.forever && (
                      <>
                        <button
                          type="button"
                          className={outlineButton}
                          disabled={busy || stars < game.priceTimed}
                          onClick={() =>
                            run({ type: "unlock-fun", gameId: game.id, mode: "timed" })
                          }
                        >
                          {t.timed(10, game.priceTimed)}
                        </button>
                        <button
                          type="button"
                          className={outlineButton}
                          disabled={busy || stars < game.priceForever}
                          onClick={() =>
                            run({ type: "unlock-fun", gameId: game.id, mode: "forever" })
                          }
                        >
                          {t.forever(game.priceForever)}
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy || stars < game.priceTimed}
                      className={outlineButton}
                      onClick={() => run({ type: "unlock-fun", gameId: game.id, mode: "timed" })}
                    >
                      {t.timed(10, game.priceTimed)}
                    </button>
                    <button
                      type="button"
                      disabled={busy || stars < game.priceForever}
                      className={outlineButton}
                      onClick={() => run({ type: "unlock-fun", gameId: game.id, mode: "forever" })}
                    >
                      {t.forever(game.priceForever)}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>
    </>
  );
}
