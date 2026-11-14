"use client";

import {
  type GameResult,
  type LearningCompletion,
  type RoundEvent,
  roundStars,
} from "@brainee/core";
import { clampLevel, GameHost, getGame } from "@brainee/games";
import { StarIcon } from "@brainee/ui/components/child-icons";
import { ArrowLeft } from "@brainee/ui/components/icons";
import Link from "next/link";
import { useRef, useState } from "react";
import { useDemoProgress } from "@/components/child/DemoProgressProvider";
import { ru } from "@/i18n/ru";
import { PostGameScreen } from "./PostGameScreen";

type Props = { gameId: string; level: number; seed: number };

export function GamePlayer({ gameId, level, seed }: Props) {
  const game = getGame(gameId);
  const preview = useDemoProgress();
  const [completion, setCompletion] = useState<LearningCompletion | null>(null);
  const [events, setEvents] = useState<RoundEvent[]>([]);
  const settled = useRef(false);
  if (!game) return null;
  const safeLevel = clampLevel(level, game.levels);
  const t = ru.child.game;
  function finish(result: GameResult) {
    if (settled.current) return;
    settled.current = true;
    setCompletion(preview.finish(result));
  }
  if (completion)
    return <PostGameScreen game={game} level={safeLevel} seed={seed} completion={completion} />;
  if (!preview.ready)
    return (
      <p role="status" className="p-6 text-center">
        {t.preparing}
      </p>
    );
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
      <header className="flex items-center gap-3 px-3 py-2">
        <Link
          href="/learn"
          onClick={preview.stop}
          className="flex min-h-12 items-center gap-1 rounded-full px-3 font-semibold transition-transform duration-(--dur-press) active:scale-95"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
          {t.exit}
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="!text-lg leading-tight">{game.title}</h1>
          <p className="text-muted-foreground text-sm">{t.level(safeLevel)}</p>
        </div>
        <p
          role="status"
          className="flex items-center gap-1 font-semibold"
          aria-label={t.starsEarned(events.reduce((sum, event) => sum + roundStars(event), 0))}
        >
          <StarIcon className="size-5" />
          {events.reduce((sum, event) => sum + roundStars(event), 0)}
        </p>
      </header>
      <GameHost
        text={ru.games}
        game={game}
        level={safeLevel}
        seed={seed}
        onRound={(event) => setEvents((list) => [...list, event])}
        onFinish={finish}
      />
    </div>
  );
}
