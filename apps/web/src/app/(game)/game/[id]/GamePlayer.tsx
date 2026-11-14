"use client";

import { type GameResult, sessionStars } from "@brainee/core";
import { clampLevel, GameHost, getGame } from "@brainee/games";
import { StarIcon } from "@brainee/ui/components/child-icons";
import { ArrowLeft } from "@brainee/ui/components/icons";
import Link from "next/link";
import { useState } from "react";
import { ru } from "@/i18n/ru";

type Props = { gameId: string; level: number; seed: number };

// Fullscreen game: header with exit, the game, then a minimal finish card.
// The real post-game screen (Brainy before → after, "Что дальше?") is T-35; rewards are T-54.
export function GamePlayer({ gameId, level, seed }: Props) {
  const game = getGame(gameId);
  const [result, setResult] = useState<GameResult | null>(null);
  if (!game) return null;
  const safeLevel = clampLevel(level, game.levels);
  const t = ru.child.game;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
      <header className="flex items-center gap-3 px-3 py-2">
        <Link
          href="/learn"
          className="flex min-h-12 items-center gap-1 rounded-full px-3 font-semibold transition-transform duration-(--dur-press) active:scale-95"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
          {t.exit}
        </Link>
        <div className="min-w-0">
          <h1 className="!text-lg leading-tight">{game.title}</h1>
          <p className="text-muted-foreground text-sm">{t.level(safeLevel)}</p>
        </div>
      </header>

      <GameHost game={game} level={safeLevel} seed={seed} onRound={() => {}} onFinish={setResult} />

      {result && (
        <section
          aria-live="polite"
          className="mx-4 my-4 flex flex-col items-center gap-3 rounded-panel border border-border bg-card p-5 text-center"
        >
          <h2 className="font-heading text-xl font-semibold">{t.done}</h2>
          <p className="flex items-center gap-1 text-lg font-semibold">
            <StarIcon className="size-5" />+{sessionStars(result)}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <a
              href={`/game/${game.id}?level=${safeLevel}`}
              className="flex min-h-14 items-center rounded-full bg-primary px-5 font-semibold text-primary-foreground transition-transform duration-(--dur-press) active:scale-95"
            >
              {t.again}
            </a>
            <Link
              href="/learn"
              className="flex min-h-14 items-center rounded-full bg-secondary px-5 font-semibold transition-transform duration-(--dur-press) active:scale-95"
            >
              {t.enough}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
