"use client";
import { FUN_HEARTBEAT_SECONDS, type GameResult } from "@brainee/core";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLearning } from "@/components/child/LearningProvider";
import { outlineButton, Panel, primaryButton } from "@/components/demo/kit";
import { useI18n } from "@/i18n";
import { SnakeGame } from "./SnakeGame";
export function FunPlayer({ id }: { id: string }) {
  const { snapshot, refresh } = useLearning();
  const game = snapshot?.showcase.fun.find((g) => g.id === id);
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
  const locked = !game || id !== "snake" || (!game.forever && remaining <= 0);
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-4 p-4 lg:grid-cols-2">
      <Panel as="h1" title={t.title}>
        <p data-testid="fun-time">
          {game?.forever
            ? t.forever
            : `${t.left}: ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
        </p>
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
        {!game?.forever && remaining === 0 && <p>{t.ended}</p>}
      </Panel>
    </div>
  );
}
