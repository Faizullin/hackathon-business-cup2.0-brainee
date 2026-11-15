"use client";
import { Brainy } from "@brainee/brainy";
import { type BrainyStats, funnelBodyStats, type QuizDraft } from "@brainee/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { quizCopy as c } from "./quiz-copy";

const gaugeColor = (s: number) =>
  s < 25 ? "#FF6F8E" : s < 40 ? "#FFAE1A" : s < 55 ? "#FF9EC2" : "#8C76FF";

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Eases a number toward its target so the brain visibly moves; instant under reduced motion. */
export function useTween(target: number, ms = 600) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (reduced() || from.current === target) {
      from.current = target;
      setValue(target);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      const eased = 1 - (1 - p) ** 3;
      const next = origin + (target - origin) * eased;
      from.current = next;
      setValue(next);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, ms]);
  return value;
}

/** The funnel brain at the current health. Full rot effects are allowed only here (D-40). */
export function FunnelBrain({
  stats,
  health,
  className,
}: {
  stats: BrainyStats;
  health: number;
  className?: string;
}) {
  const mood = useTween(health);
  return <Brainy stats={stats} mood={mood} effects="full" animate className={className} />;
}

export function BrainPanel({
  draft,
  health,
  delta,
}: {
  draft: QuizDraft;
  health: number;
  delta: number;
}) {
  const stats = useMemo(() => funnelBodyStats(draft), [draft]);
  const shown = Math.round(useTween(health));
  return (
    <aside className="brain" aria-label={c.panel.label} data-testid="brain-panel">
      <div className="disc">
        <FunnelBrain stats={stats} health={health} />
        <span
          className={`delta${delta ? " show" : ""}`}
          data-testid="brain-delta"
          aria-hidden="true"
        >
          {delta ? `−${delta}` : ""}
        </span>
      </div>
      <div className="meta">
        <span className="kicker">{c.panel.kicker}</span>
        <div className="score" data-testid="brain-score" data-score={health}>
          <b>{shown}</b>
          <span>{c.panel.score}</span>
        </div>
        <div className="gauge">
          <i style={{ width: `${shown}%`, background: gaugeColor(shown) }} />
        </div>
      </div>
      <p>{c.panel.caption}</p>
    </aside>
  );
}
