"use client";

import { funMinutesLeft } from "@brainee/core";
import {
  Bone,
  Clapperboard,
  Crosshair,
  Drum,
  Fish,
  Flower2,
  Headphones,
  Orbit,
  Play,
  Rocket,
  Route,
  Worm,
} from "@brainee/ui/components/icons";
import { cn } from "@brainee/ui/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Chip,
  Notice,
  outlineButton,
  Panel,
  primaryButton,
  smallButton,
  useAct,
} from "@/components/demo/kit";
import { ru } from "@/i18n/ru";
import { useLearning } from "./LearningProvider";

const FUN_ICONS = { snake: Worm, rocket: Rocket, drum: Drum, target: Crosshair, maze: Route };
export const SCIENCE_ICONS = { wave: Fish, bee: Flower2, planet: Orbit, dino: Bone };

// Leisure tab (T-36): fun-game shop for ★, cartoons for ★, free science videos.
export function LeisureScreen() {
  const { snapshot } = useLearning();
  const { run, busy, notice } = useAct();
  const [now, setNow] = useState(() => new Date());
  const [soon, setSoon] = useState<string | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);
  if (!snapshot) return null;
  const { fun, cartoons, science } = snapshot.showcase;
  const stars = snapshot.progress.wallet.stars;
  const t = ru.child.leisure;
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
                      onClick={() =>
                        game.id === "snake"
                          ? window.location.assign(`/fun/${game.id}`)
                          : setSoon(game.id)
                      }
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
                    {soon === game.id && (
                      <p role="status" className="w-full text-muted-foreground text-xs">
                        {t.soon}
                      </p>
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
      <Panel title={t.cartoons} note={t.noNext}>
        <ul className="grid gap-3 sm:grid-cols-3">
          {cartoons.map((cartoon) => (
            <li
              key={cartoon.id}
              className="flex flex-col gap-2 rounded-xl border border-border p-3"
            >
              <span className="grid aspect-video place-items-center rounded-lg bg-coral/15">
                {cartoon.detail.startsWith("Аудио") ? (
                  <Headphones aria-hidden="true" className="size-8 text-coral" />
                ) : (
                  <Clapperboard aria-hidden="true" className="size-8 text-coral" />
                )}
              </span>
              <span className="font-semibold">{cartoon.title}</span>
              <span className="text-muted-foreground text-xs">{cartoon.detail}</span>
              {cartoon.owned ? (
                <Link href={`/cartoon/${cartoon.id}`} className={primaryButton}>
                  {t.watch}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={busy || stars < cartoon.price}
                  className={outlineButton}
                  onClick={() => run({ type: "buy-cartoon", id: cartoon.id })}
                >
                  {t.buy(cartoon.price)}
                </button>
              )}
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title={t.science} note={t.scienceNote}>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {science.map((video) => {
            const Icon = SCIENCE_ICONS[video.icon as keyof typeof SCIENCE_ICONS] ?? Play;
            return (
              <li key={video.id}>
                <Link
                  href={`/video/${video.id}`}
                  className="flex items-center gap-3 rounded-xl p-3 text-white transition-transform duration-(--dur-press) active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, ${video.colors[0]}, ${video.colors[1]})`,
                  }}
                >
                  <Icon aria-hidden="true" className="size-10 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{video.title}</span>
                    <span className="text-sm opacity-90">
                      {video.solved
                        ? t.solved
                        : video.position > 0
                          ? t.resume(video.position)
                          : t.minutes(video.minutes)}
                    </span>
                  </span>
                  <span className={cn(smallButton, "bg-white/20")}>
                    <Play aria-hidden="true" className="size-4" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Panel>
    </>
  );
}
