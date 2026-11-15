"use client";

import {
  type GameResult,
  type LearningCompletion,
  type RoundEvent,
  roundStars,
} from "@brainee/core";
import { clampLevel, type GameDefinition, GameHost, getGame } from "@brainee/games";
import { Button } from "@brainee/ui/components/button";
import { StarIcon } from "@brainee/ui/components/child-icons";
import { ArrowLeft } from "@brainee/ui/components/icons";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LearningBoundary } from "@/components/child/LearningBoundary";
import { useLearning } from "@/components/child/LearningProvider";
import { StopLearningButton } from "@/components/child/StopLearningButton";
import { iconControl, PlayerHeader, playerSurface } from "@/components/game/PlayerHeader";
import { useI18n } from "@/i18n";
import {
  canRetryFinish,
  type IssuedGame,
  LearningApiError,
  pendingGameHref,
} from "@/lib/learning-api";
import { hostCopy } from "./host-copy";
import { PostGameScreen } from "./PostGameScreen";

type Props = {
  gameId: string;
  level: number;
  seed?: number;
  remoteGame?: Extract<GameDefinition, { runtime: "embedded" }>;
};
type Phase = "starting" | "start-error" | "playing" | "saving" | "save-error";

export function GamePlayer(props: Props) {
  const [attempt, setAttempt] = useState(0);
  return (
    <LearningBoundary game>
      <ActiveGamePlayer key={attempt} {...props} onStartRetry={() => setAttempt((n) => n + 1)} />
    </LearningBoundary>
  );
}

function ActiveGamePlayer({
  gameId,
  level,
  seed,
  remoteGame,
  onStartRetry,
}: Props & { onStartRetry(): void }) {
  const game = getGame(gameId) ?? remoteGame;
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
  const { t: i18n, locale } = useI18n();
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
      <PostGameScreen game={game} level={issued.level} seed={issued.seed} completion={completion} />
    );
  if (phase !== "playing" || !issued) {
    const failed = phase === "save-error" || phase === "start-error";
    const retryable = canRetryFinish(error);
    const accessExpired = error instanceof LearningApiError && error.status === 401;
    return (
      <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 p-6 text-center">
        <h1>{game.title}</h1>
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
    <div className={playerSurface}>
      <PlayerHeader
        title={game.title}
        subtitle={t.level(issued.level)}
        exit={
          <StopLearningButton href="/learn" variant="ghost" label={t.exit} className={iconControl}>
            <ArrowLeft className="size-5" aria-hidden="true" />
          </StopLearningButton>
        }
        status={
          <p
            role="status"
            className="flex items-center gap-1 font-semibold"
            aria-label={t.starsEarned(events.reduce((sum, event) => sum + roundStars(event), 0))}
          >
            <StarIcon className="size-5" />
            {events.reduce((sum, event) => sum + roundStars(event), 0)}
          </p>
        }
      />
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
        className="min-h-0 overflow-hidden rounded-stage bg-(--game-tile) ring-1 ring-(--game-tile-ring) lg:mx-auto lg:w-full lg:max-w-[680px]"
      >
        <GameHost
          locale={locale}
          sessionId={issued.sessionId}
          text={i18n.games}
          game={game}
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
