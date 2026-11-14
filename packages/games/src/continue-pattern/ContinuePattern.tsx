"use client";

import { roundStars } from "@brainee/core";
import { useMemo, useRef, useState } from "react";
import { clampLevel, type GameProps } from "../kit";
import { Shape } from "../kit/Shape";
import { generateRounds } from "./rounds";

export default function ContinuePattern({
  level: requestedLevel,
  seed,
  text,
  onRound,
  onFinish,
}: GameProps) {
  const level = clampLevel(requestedLevel, 2);
  const rounds = useMemo(() => generateRounds(level, seed), [level, seed]);
  const started = useRef(Date.now());
  const totals = useRef({ mistakes: 0, corrections: 0 });
  const locked = useRef(false);
  const finished = useRef(false);
  const missed = useRef(false);
  const [index, setIndex] = useState(0);
  const [solved, setSolved] = useState(false);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [shake, setShake] = useState({ cell: -1, count: 0 });
  const round = rounds[index];
  if (!round) return null;
  const last = index === rounds.length - 1;
  function answer(cell: number) {
    if (!round || locked.current || finished.current) return;
    const correct = cell === round.answerIndex;
    if (correct) {
      locked.current = true;
      const event = { correct: true, afterMistake: missed.current };
      if (missed.current) totals.current.corrections++;
      setSolved(true);
      setFeedback(text.correct(roundStars(event), missed.current));
      onRound(event);
    } else {
      totals.current.mistakes++;
      missed.current = true;
      setShake((value) => ({ cell, count: value.count + 1 }));
      setFeedback(text.almost);
      onRound({ correct: false, afterMistake: true });
    }
  }
  function next() {
    if (!locked.current || finished.current) return;
    if (last) {
      finished.current = true;
      setDone(true);
      onFinish({
        gameId: "continue-pattern",
        level,
        rounds: rounds.length,
        ...totals.current,
        durationMs: Date.now() - started.current,
      });
    } else {
      locked.current = false;
      missed.current = false;
      setIndex(index + 1);
      setSolved(false);
      setFeedback("");
      setShake({ cell: -1, count: 0 });
    }
  }
  return (
    <div
      data-game="continue-pattern"
      className="mx-auto flex w-full max-w-xl flex-col gap-5 p-4 select-none"
    >
      <p className="text-muted-foreground text-sm">{text.round(index + 1, rounds.length)}</p>
      <h2 className="font-heading text-lg font-semibold">{text.patternInstruction}</h2>
      <ol
        aria-label={text.sequence}
        className="grid items-center gap-1 rounded-2xl border border-border bg-card p-2"
        style={{ gridTemplateColumns: `repeat(${round.sequence.length + 1}, minmax(0, 1fr))` }}
      >
        {round.sequence.map((spec, position) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: positions are fixed within a seeded round
          <li key={`${round.id}-${position}`} className="aspect-square">
            <Shape spec={spec} />
          </li>
        ))}
        <li
          aria-label={text.missingShape}
          className="flex aspect-square items-center justify-center rounded-lg border-2 border-sky border-dashed font-heading text-xl text-sky"
        >
          ?
        </li>
      </ol>
      <div className="grid grid-cols-3 gap-3">
        {round.options.map((spec, cell) => (
          <button
            key={`${round.id}-${spec.shape}-${spec.color}-${spec.scale}-${shake.cell === cell ? shake.count : 0}`}
            type="button"
            aria-label={text.choice(cell + 1)}
            disabled={solved || done}
            onClick={() => answer(cell)}
            className={`aspect-square min-h-14 touch-manipulation rounded-2xl border-2 bg-card p-3 transition-transform duration-(--dur-press) active:scale-95 ${solved && cell === round.answerIndex ? "border-mint" : "border-line"} ${shake.cell === cell ? "animate-[brainee-shake_300ms_var(--ease-out)]" : ""}`}
          >
            <Shape spec={spec} />
          </button>
        ))}
      </div>
      <div className="flex min-h-14 items-center justify-between gap-3">
        <p aria-live="polite" className="font-medium">
          {feedback}
          {done && ` ${text.completed}`}
        </p>
        {solved && !done && (
          <button
            type="button"
            onClick={next}
            className="min-h-14 shrink-0 rounded-full bg-primary px-5 font-semibold text-primary-foreground transition-transform duration-(--dur-press) active:scale-95"
          >
            {last ? text.done : text.next}
          </button>
        )}
      </div>
    </div>
  );
}
