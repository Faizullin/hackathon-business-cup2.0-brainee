"use client";

import { type GameResult, type RoundEvent, roundStars, sessionStars } from "@brainee/core";
import { allGames, clampLevel, GameHost } from "@brainee/games";
import { Button } from "@brainee/ui/components/button";
import { useId, useState } from "react";
import { useI18n } from "@/i18n";

type Status = "running" | "finished" | "error";
type LabEvent =
  | { type: "ready" }
  | { type: "round"; event: RoundEvent }
  | { type: "finish"; result: GameResult }
  | { type: "error"; message: string };

const FRAMES = { phone: "max-w-[390px]", ipad: "max-w-[820px]", fill: "max-w-none" } as const;
type Frame = keyof typeof FRAMES;

const fieldClass =
  "min-h-12 rounded-xl border border-border bg-card px-3 text-foreground focus-visible:outline-3 focus-visible:outline-ring";

export function LabClient() {
  const { t: ru, tc } = useI18n();
  const ids = { game: useId(), level: useId(), seed: useId(), frame: useId() };
  const [gameId, setGameId] = useState(allGames[0]?.id ?? "");
  const [level, setLevel] = useState(1);
  const [seed, setSeed] = useState(42);
  const [frame, setFrame] = useState<Frame>("phone");
  const [run, setRun] = useState(0);
  const [status, setStatus] = useState<Status>("running");
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<LabEvent[]>([]);

  const game = allGames.find((g) => g.id === gameId) ?? allGames[0];
  if (!game) return null;
  const safeLevel = clampLevel(level, game.levels);

  function restart(changes?: () => void) {
    changes?.();
    setConnected(false);
    setEvents([]);
    setStatus("running");
    setRun((n) => n + 1);
  }

  const finish = events.find((e) => e.type === "finish");
  const roundTotal = events.reduce(
    (sum, e) => (e.type === "round" ? sum + roundStars(e.event) : sum),
    0,
  );

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
      <section aria-label={tc(game.title)} className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <label htmlFor={ids.game} className="flex flex-col gap-1 text-sm font-medium">
            {ru.lab.game}
            <select
              id={ids.game}
              className={fieldClass}
              value={game.id}
              onChange={(e) => restart(() => setGameId(e.target.value))}
            >
              {allGames.map((g) => (
                <option key={g.id} value={g.id}>
                  {tc(g.title)}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor={ids.level} className="flex flex-col gap-1 text-sm font-medium">
            {ru.lab.level}
            <select
              id={ids.level}
              className={fieldClass}
              value={safeLevel}
              onChange={(e) => restart(() => setLevel(Number(e.target.value)))}
            >
              {Array.from({ length: game.levels }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor={ids.seed} className="flex flex-col gap-1 text-sm font-medium">
            {ru.lab.seed}
            <input
              id={ids.seed}
              type="number"
              inputMode="numeric"
              className={`${fieldClass} w-28`}
              value={seed}
              onChange={(e) => restart(() => setSeed(Number(e.target.value) || 0))}
            />
          </label>
          <label htmlFor={ids.frame} className="flex flex-col gap-1 text-sm font-medium">
            {ru.lab.frame}
            <select
              id={ids.frame}
              className={fieldClass}
              value={frame}
              onChange={(e) => setFrame(e.target.value as Frame)}
            >
              {(Object.keys(FRAMES) as Frame[]).map((f) => (
                <option key={f} value={f}>
                  {ru.lab.frames[f]}
                </option>
              ))}
            </select>
          </label>
          <Button variant="outline" onClick={() => restart()}>
            {ru.lab.restart}
          </Button>
          <Button
            variant="ghost"
            onClick={() => restart(() => setSeed(Math.floor(Math.random() * 100000)))}
          >
            {ru.lab.randomSeed}
          </Button>
        </div>

        <div
          className={`mx-auto w-full ${FRAMES[frame]} rounded-panel border border-border bg-background`}
        >
          <GameHost
            onReady={() => {
              setConnected(true);
              setEvents((list) => [...list, { type: "ready" }]);
            }}
            text={ru.games}
            key={`${game.id}-${safeLevel}-${seed}-${run}`}
            game={game}
            level={safeLevel}
            seed={seed}
            onRound={(event) => setEvents((list) => [...list, { type: "round", event }])}
            onFinish={(result) => {
              setEvents((list) => [...list, { type: "finish", result }]);
              setStatus("finished");
            }}
            onError={(error) => {
              setEvents((list) => [...list, { type: "error", message: error.message }]);
              setStatus("error");
            }}
          />
        </div>
      </section>

      <aside
        data-testid="event-stream"
        data-status={
          game.runtime === "embedded" && connected && status === "running" ? "connected" : status
        }
        className="flex flex-col gap-3 rounded-panel border border-border bg-card p-4"
      >
        <h2 className="font-heading font-semibold">{ru.lab.events}</h2>
        <p role="status" className="text-sm">
          {ru.lab.status[status]}
        </p>
        {finish?.type === "finish" && (
          <p className="rounded-xl bg-secondary p-3 text-sm">
            {ru.lab.rewardPreview}: <b>+{sessionStars(finish.result)} ★</b> (
            {ru.child.game.starsEarned(roundTotal)})
          </p>
        )}
        <ol className="flex max-h-[60dvh] flex-col gap-1 overflow-auto font-mono text-xs">
          {events.length === 0 && <li className="text-muted-foreground">{ru.lab.noEvents}</li>}
          {events.map((e, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: append-only log
            <li key={i} data-event={e.type}>
              {e.type === "ready" && "ready"}
              {e.type === "round" &&
                `round correct=${e.event.correct} afterMistake=${e.event.afterMistake}`}
              {e.type === "finish" && `finish ${JSON.stringify(e.result)}`}
              {e.type === "error" && `error ${e.message}`}
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
