"use client";

import { roundStars } from "@brainee/core";
import { useMemo, useRef, useState } from "react";
import { clampLevel, type GameProps } from "../kit";
import { generateRounds } from "./rounds";
import { Shape } from "./Shape";

type Feedback = { kind: "correct"; stars: number; corrected: boolean } | { kind: "miss" } | null;

export default function OddOneOut({ level: requestedLevel, seed, onRound, onFinish }: GameProps) {
  const level = clampLevel(requestedLevel, 2);
  const rounds = useMemo(() => generateRounds(level, seed), [level, seed]);
  const startedAt = useRef(Date.now());
  const totals = useRef({ mistakes: 0, corrections: 0 });
  const [index, setIndex] = useState(0);
  const [missed, setMissed] = useState(false);
  const [solved, setSolved] = useState(false);
  const [shakeCell, setShakeCell] = useState<{ cell: number; n: number } | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [done, setDone] = useState(false);

  const round = rounds[index];
  if (!round) return null;
  const isLast = index === rounds.length - 1;

  function answer(cell: number) {
    if (solved || done || !round) return;
    if (cell === round.oddIndex) {
      const event = { correct: true, afterMistake: missed };
      if (missed) totals.current.corrections++;
      setSolved(true);
      setFeedback({ kind: "correct", stars: roundStars(event), corrected: missed });
      onRound(event);
    } else {
      totals.current.mistakes++;
      setMissed(true);
      setShakeCell((s) => ({ cell, n: (s?.n ?? 0) + 1 }));
      setFeedback({ kind: "miss" });
      onRound({ correct: false, afterMistake: true });
    }
  }

  function next() {
    if (isLast) {
      setDone(true);
      onFinish({
        gameId: "odd-one-out",
        level,
        rounds: rounds.length,
        mistakes: totals.current.mistakes,
        corrections: totals.current.corrections,
        durationMs: Date.now() - startedAt.current,
      });
      return;
    }
    setIndex(index + 1);
    setMissed(false);
    setSolved(false);
    setShakeCell(null);
    setFeedback(null);
  }

  return (
    <div
      className="mx-auto flex w-full max-w-xl flex-col gap-4 p-4 select-none"
      data-game="odd-one-out"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Раунд {index + 1} из {rounds.length}
        </p>
        <ol className="flex gap-1.5" aria-hidden="true">
          {rounds.map((r, i) => (
            <li
              key={r.id}
              className={`h-2 w-6 rounded-full ${i < index || (i === index && done) ? "bg-mint" : i === index ? "bg-sky" : "bg-line"}`}
            />
          ))}
        </ol>
      </div>

      <h2 className="font-heading text-lg font-semibold">Найди фигуру, которая отличается</h2>

      <div
        className="grid gap-2.5"
        style={{ gridTemplateColumns: `repeat(${round.cells === 9 ? 3 : 4}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: round.cells }, (_, cell) => {
          const isOdd = cell === round.oddIndex;
          const shaking = shakeCell?.cell === cell;
          return (
            <button
              // Re-mount on each miss so the shake animation replays.
              key={shaking ? `${cell}-shake-${shakeCell.n}` : `${index}-${cell}`}
              type="button"
              aria-label={`Фигура ${cell + 1}`}
              disabled={solved || done}
              onClick={() => answer(cell)}
              className={`aspect-square min-h-14 touch-manipulation rounded-2xl border-2 bg-card p-3 transition-transform duration-(--dur-press) active:scale-95 disabled:cursor-default ${
                solved && isOdd ? "border-mint" : "border-line"
              } ${shaking ? "animate-[brainee-shake_300ms_var(--ease-out)]" : ""}`}
            >
              <Shape spec={isOdd ? round.odd : round.base} />
            </button>
          );
        })}
      </div>

      <div className="flex min-h-12 items-center justify-between gap-3" aria-live="polite">
        <p className="font-medium">
          {feedback?.kind === "miss" && "Почти! Присмотрись и попробуй ещё раз"}
          {feedback?.kind === "correct" &&
            `${feedback.corrected ? "Звезда за исправление!" : "Верно!"} +${feedback.stars} ★`}
          {done && " Игра пройдена!"}
        </p>
        {solved && !done && (
          <button
            type="button"
            onClick={next}
            className="min-h-12 rounded-full bg-primary px-5 font-semibold text-primary-foreground transition-transform duration-(--dur-press) active:scale-95"
          >
            {isLast ? "Готово" : "Дальше"}
          </button>
        )}
      </div>
    </div>
  );
}
