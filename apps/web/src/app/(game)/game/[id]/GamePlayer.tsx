"use client";

import {
  type GameResult,
  type LearningCompletion,
  type RoundEvent,
  roundStars,
} from "@brainee/core";
import { clampLevel, GameHost, getGame } from "@brainee/games";
import { Button } from "@brainee/ui/components/button";
import { StarIcon } from "@brainee/ui/components/child-icons";
import { ArrowLeft } from "@brainee/ui/components/icons";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LearningBoundary } from "@/components/child/LearningBoundary";
import { useLearning } from "@/components/child/LearningProvider";
import { StopLearningButton } from "@/components/child/StopLearningButton";
import { useI18n } from "@/i18n";
import {
  canRetryFinish,
  type IssuedGame,
  LearningApiError,
  pendingGameHref,
} from "@/lib/learning-api";
import { hostCopy } from "./host-copy";
import { PostGameScreen } from "./PostGameScreen";

type Props = { gameId: string; level: number; seed?: number };
type Phase = "starting" | "start-error" | "playing" | "saving" | "save-error";

export function GamePlayer(props: Props) {
  const [attempt, setAttempt] = useState(0);
  return (
    <LearningBoundary game>
      <ActiveGamePlayer key={attempt} {...props} onStartRetry={() => setAttempt((n) => n + 1)} />
    </LearningBoundary>
  );
}

function ActiveGamePlayer({ gameId, level, seed, onStartRetry }: Props & { onStartRetry(): void }) {
  const game = getGame(gameId);
  const { pending, start, finish, discardPending } = useLearning();
  const [initialPending] = useState(pending);
  const [phase, setPhase] = useState<Phase>(initialPending ? "saving" : "starting");
  const [issued, setIssued] = useState<IssuedGame | null>(initialPending?.issued ?? null);
  const [completion, setCompletion] = useState<LearningCompletion | null>(null);
  const [events, setEvents] = useState<RoundEvent[]>([]);
  const [error, setError] = useState<unknown>(null);
  const settled = useRef(!!initialPending);
  const result = useRef<GameResult | null>(initialPending?.result ?? null);
  const boot = useRef<Promise<IssuedGame> | null>(null);
  const router = useRouter();
  const safeLevel = clampLevel(level, game?.levels ?? 1);
  const { t: i18n, tc, locale } = useI18n();
  const t = i18n.child.game;
  const sync = i18n.child.sync;
  const matches =
    !initialPending ||
    (initialPending.issued.gameId === gameId &&
      initialPending.issued.level === safeLevel &&
      (seed === undefined || initialPending.issued.seed === seed));

  const save = useCallback(
    async (launch: IssuedGame, value: GameResult) => {
      setPhase("saving");
      setError(null);
      try {
        setCompletion(await finish(launch, value));
      } catch (error) {
        setError(error);
        setPhase("save-error");
      }
    },
    [finish],
  );

  useEffect(() => {
    if (!matches && initialPending) {
      router.replace(pendingGameHref(initialPending.issued));
      return;
    }
    let mounted = true;
    boot.current ??= initialPending
      ? Promise.resolve(initialPending.issued)
      : start(gameId, safeLevel, seed);
    void boot.current
      .then((launch) => {
        if (!mounted) return;
        setIssued(launch);
        if (initialPending) void save(launch, initialPending.result);
        else setPhase("playing");
      })
      .catch((error) => {
        if (mounted) {
          setError(error);
          setPhase("start-error");
        }
      });
    return () => {
      mounted = false;
    };
  }, [gameId, safeLevel, seed, initialPending, matches, router, start, save]);

  if (!game) return null;
  if (completion && issued)
    return (
      <PostGameScreen
        game={{ ...game, title: tc(game.title) }}
        level={issued.level}
        seed={issued.seed}
        completion={completion}
      />
    );
  if (phase !== "playing" || !issued) {
    const failed = phase === "save-error" || phase === "start-error";
    const retryable = canRetryFinish(error);
    const accessExpired = error instanceof LearningApiError && error.status === 401;
    return (
      <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 p-6 text-center">
        <h1>{tc(game.title)}</h1>
        <p role={failed ? "alert" : "status"}>
          {phase === "start-error"
            ? accessExpired
              ? sync.accessError
              : sync.startError
            : phase === "save-error"
              ? retryable
                ? sync.saveError
                : sync.expired
              : phase === "saving"
                ? sync.saving
                : t.preparing}
        </p>
        {phase === "start-error" && (
          <Button
            size="child"
            onClick={() => {
              if (accessExpired) window.location.reload();
              else onStartRetry();
            }}
          >
            {accessExpired ? sync.reload : sync.retry}
          </Button>
        )}
        {phase === "save-error" && retryable && (
          <Button
            size="child"
            onClick={() => {
              if (issued && result.current) void save(issued, result.current);
            }}
          >
            {sync.saveRetry}
          </Button>
        )}
        {phase === "save-error" && !retryable && (
          <Button
            size="child"
            onClick={() => {
              discardPending();
              window.location.reload();
            }}
          >
            {sync.restart}
          </Button>
        )}
      </section>
    );
  }
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 bg-(--game-surface) p-3 lg:max-w-5xl lg:p-5">
      <header className="flex items-center gap-3 rounded-stage bg-(--game-tile) px-3 py-2 ring-1 ring-(--game-tile-ring)">
        <StopLearningButton href="/learn" variant="ghost">
          <ArrowLeft className="size-5" aria-hidden="true" />
          {t.exit}
        </StopLearningButton>
        <div className="min-w-0 flex-1">
          <h1 className="!text-lg leading-tight">{tc(game.title)}</h1>
          <p className="text-muted-foreground text-sm">{t.level(issued.level)}</p>
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
      <div className="flex items-center gap-3 px-2">
        <div
          role="progressbar"
          aria-label={hostCopy.progress}
          aria-valuemin={0}
          aria-valuemax={game.roundsPerSession}
          aria-valuenow={events.filter((e) => e.correct).length}
          className="h-2 flex-1 overflow-hidden rounded-full bg-(--game-selected-wash)"
        >
          <span
            className="block h-full rounded-full bg-(--game-selected) transition-[width] duration-500"
            style={{
              width: `${Math.min(100, (events.filter((e) => e.correct).length / game.roundsPerSession) * 100)}%`,
            }}
          />
        </div>
        <span className="font-display text-xs">
          {events.filter((e) => e.correct).length}/{game.roundsPerSession}
        </span>
      </div>
      {events.length > 0 && (
        <p
          role="status"
          key={events.length}
          className={`rounded-row px-4 py-2 text-sm font-bold ${events.at(-1)?.correct ? "gainA bg-(--game-correct-wash) text-(--game-correct)" : "lossA bg-(--game-retry-wash) text-(--game-retry)"}`}
        >
          {events.at(-1)?.correct ? `✓ ${hostCopy.complete}` : hostCopy.retry}
        </p>
      )}
      <div
        data-testid="game-host-frame"
        className="min-h-0 flex-1 overflow-hidden rounded-stage bg-(--game-tile) ring-1 ring-(--game-tile-ring)"
      >
        <GameHost
          locale={locale}
          sessionId={issued.sessionId}
          text={i18n.games}
          game={{ ...game, title: tc(game.title) }}
          level={issued.level}
          seed={issued.seed}
          onRound={(event) => setEvents((list) => [...list, event])}
          onFinish={(value) => {
            if (settled.current) return;
            settled.current = true;
            result.current = value;
            void save(issued, value);
          }}
        />
      </div>
    </div>
  );
}
