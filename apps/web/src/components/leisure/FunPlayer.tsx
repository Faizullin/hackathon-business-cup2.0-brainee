"use client";
import { FUN_HEARTBEAT_SECONDS, type GameResult } from "@brainee/core";
import { useCatalog } from "@brainee/games";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AvailablePreview } from "@/app/(game)/explore/[id]/ExplorePlayer";
import { useLearning } from "@/components/child/LearningProvider";
import { stoppingCopy } from "@/components/child/stopping-copy";
import { outlineButton, Panel, primaryButton } from "@/components/demo/kit";
import { StoppingPhrase } from "@/components/family-plan/StoppingPhrase";
import { useI18n } from "@/i18n";
import { SnakeGame } from "./SnakeGame";
export function FunPlayer({ id }: { id: string }) {
  const { snapshot, refresh } = useLearning();
  const game = snapshot?.showcase.fun.find((g) => g.id === id);
  const preview = useCatalog().previews.find((p) => p.id === id);
  const [ended, setEnded] = useState(false),
    [gameKey, setGameKey] = useState(0),
    [playing, setPlaying] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    [left, setLeft] = useState<number | null>(null);
  const session = useRef<{ id: string; sequence: number } | null>(null),
    seconds = useRef(0),
    queue = useRef(Promise.resolve());
  const { t: i18n } = useI18n();
  const t = i18n.playTime;
  const flush = useCallback(() => {
    const credit = seconds.current;
    seconds.current = 0;
    const current = session.current;
    if (!current || credit <= 0) return queue.current;
    const sequence = ++current.sequence;
    queue.current = queue.current
      .then(async () => {
        const r = await fetch("/api/fun", {
          method: "POST",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "tick",
            gameId: id,
            id: current.id,
            sequence,
            seconds: credit,
          }),
        });
        if (!r.ok) throw Error();
        const reply = await r.json();
        setLeft(reply.remainingSeconds);
        void refresh();
      })
      .catch(() => {
        setError(true);
        setPlaying(false);
      });
    return queue.current;
  }, [id, refresh]);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      seconds.current++;
      setLeft((value) => (value === null ? value : Math.max(0, value - 1)));
      if (seconds.current >= FUN_HEARTBEAT_SECONDS) void flush();
    }, 1000);
    const hide = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", hide);
      void flush();
    };
  }, [playing, flush]);
  useEffect(() => {
    if (playing && !game?.forever && left === 0) setPlaying(false);
  }, [playing, left, game?.forever]);
  const finish = useCallback((_result: GameResult) => {
    setEnded(true);
    setPlaying(false);
  }, []);
  const start = async () => {
    setBusy(true);
    setError(false);
    await flush();
    try {
      const r = await fetch("/api/fun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "start", gameId: id }),
      });
      if (!r.ok) throw Error();
      const reply = await r.json();
      session.current = { id: reply.id, sequence: 0 };
      setLeft(reply.remainingSeconds);
      if (ended) {
        setGameKey((k) => k + 1);
        setEnded(false);
      }
      setPlaying(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  if (!snapshot) return null;
  const remaining = left ?? game?.remainingSeconds ?? 0;
  const explore = game?.kind === "explore";
  const age = new Date().getFullYear() - snapshot.child.birthYear;
  const tooYoung = explore && age < (game?.minAge ?? 0);
  const locked =
    !game || (explore ? !preview || tooYoung : id !== "snake") || (!game.forever && remaining <= 0);
  const time = game?.forever
    ? t.forever
    : `${t.left}: ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
  const stopping = !game?.forever && remaining === 0 && (
    <aside className="space-y-4 rounded-stage bg-[#1c1b33] p-5 text-white">
      <h2 className="font-heading text-xl">{t.ended}</h2>
      <p className="text-sm text-[#cfcde6]">{stoppingCopy.funReason}</p>
      <StoppingPhrase />
    </aside>
  );
  // Explore games bought for ★ (D-42 remote or built-in) play in their own sandboxed iframe.
  if (explore)
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 p-3 lg:p-5">
        {playing && preview && !locked ? (
          <>
            <AvailablePreview
              game={preview}
              exitHref="/leisure"
              status={
                <span data-testid="fun-time" className="font-semibold text-accent text-sm">
                  {time}
                </span>
              }
            />
            <button type="button" className={outlineButton} onClick={() => setPlaying(false)}>
              {t.pause}
            </button>
          </>
        ) : (
          <Panel as="h1" title={game?.title ?? t.title}>
            <p data-testid="fun-time">{time}</p>
            {tooYoung ? (
              <p>{i18n.learn.lockedAge(game?.minAge ?? 0)}</p>
            ) : locked ? (
              <p>{t.locked}</p>
            ) : (
              <button
                type="button"
                disabled={busy}
                className={primaryButton}
                onClick={() => void start()}
              >
                {t.start}
              </button>
            )}
            {error && <p role="alert">{t.error}</p>}
            <div className="flex flex-wrap gap-2">
              <Link href="/leisure" className={outlineButton}>
                {t.leisure}
              </Link>
              <Link href="/learn" className={outlineButton}>
                {t.learn}
              </Link>
            </div>
            {stopping}
          </Panel>
        )}
      </div>
    );
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-4 p-4 [--color-coral:var(--accent)] lg:grid-cols-2">
      <Panel as="h1" title={t.title}>
        <p data-testid="fun-time">{time}</p>
        {locked ? (
          <p>{t.locked}</p>
        ) : (
          <>
            <SnakeGame key={gameKey} active={playing} onFinish={finish} />
            <button
              type="button"
              disabled={busy}
              className={primaryButton}
              onClick={() => (playing ? setPlaying(false) : void start())}
            >
              {playing ? t.pause : ended ? t.retry : t.start}
            </button>
          </>
        )}
        {error && <p role="alert">{t.error}</p>}
      </Panel>
      <Panel>
        <Link href="/leisure" className={outlineButton}>
          {t.leisure}
        </Link>
        <Link href="/learn" className={outlineButton}>
          {t.learn}
        </Link>
        {stopping}
      </Panel>
    </div>
  );
}
