"use client";
import {
  type Direction,
  type GameResult,
  newSnake,
  SNAKE_SIZE,
  SNAKE_TICK_MS,
  stepSnake,
} from "@brainee/core";
import { useEffect, useRef, useState } from "react";
import { outlineButton } from "@/components/demo/kit";
import { useI18n } from "@/i18n";
/** Native React game: emits a result through props; the leisure host never grants learning rewards. */
export function SnakeGame({
  active,
  onFinish,
}: {
  active: boolean;
  onFinish(result: GameResult): void;
}) {
  const [state, setState] = useState(newSnake),
    direction = useRef<Direction>("right"),
    duration = useRef(0),
    reported = useRef(false);
  const { t: i18n } = useI18n();
  const t = i18n.playTime;
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      duration.current += SNAKE_TICK_MS;
      setState((s) => stepSnake(s, direction.current));
    }, SNAKE_TICK_MS);
    return () => clearInterval(timer);
  }, [active]);
  useEffect(() => {
    if (state.over && !reported.current) {
      reported.current = true;
      onFinish({
        gameId: "snake",
        level: 1,
        rounds: state.score,
        mistakes: 1,
        corrections: 0,
        durationMs: duration.current,
      });
    }
  }, [state, onFinish]);
  useEffect(() => {
    const keys: Record<string, Direction> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    };
    const press = (e: KeyboardEvent) => {
      if (active && keys[e.key]) {
        e.preventDefault();
        direction.current = keys[e.key] as Direction;
      }
    };
    window.addEventListener("keydown", press);
    return () => window.removeEventListener("keydown", press);
  }, [active]);
  return (
    <>
      <svg
        viewBox={`0 0 ${SNAKE_SIZE} ${SNAKE_SIZE}`}
        role="img"
        aria-label={t.board}
        className="aspect-square w-full max-w-sm rounded-xl bg-mint/10"
      >
        <title>{t.board}</title>
        {state.body.map((n, i) => (
          <rect
            key={n}
            x={(n % SNAKE_SIZE) + 0.05}
            y={Math.floor(n / SNAKE_SIZE) + 0.05}
            width=".9"
            height=".9"
            rx=".2"
            fill={i === 0 ? "var(--color-coral)" : "var(--color-mint)"}
          />
        ))}
        <circle
          cx={(state.food % SNAKE_SIZE) + 0.5}
          cy={Math.floor(state.food / SNAKE_SIZE) + 0.5}
          r=".3"
          fill="var(--color-sun)"
        />
      </svg>
      <p>
        {t.score}: {state.score}
      </p>
      {state.over && <p role="status">{t.over}</p>}
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ["up", t.up],
            ["down", t.down],
            ["left", t.leftKey],
            ["right", t.right],
          ] as const
        ).map(([d, label]) => (
          <button
            key={d}
            type="button"
            className={`${outlineButton} min-h-14`}
            onClick={() => {
              direction.current = d;
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
