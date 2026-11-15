import confetti from "canvas-confetti";
import type { Rect } from "./layout";
import type { Point } from "./snap";

/** The PECS web app's confetti colours. */
const CONFETTI_COLORS = ["#619451", "#8BC34A", "#F9BB00", "#6D96EE", "#F4A6B8"];

/**
 * The celebration for a right answer, the same one the PECS web app plays
 * (pecs-frontend `TaskFeedback`, same library and settings): a burst where the
 * piece landed, then two cannons from the board's lower corners.
 *
 * `origin` and `board` are in window pixels, which is what a game drawn with
 * `scaleMode: "resize"` uses. The confetti is drawn on its own canvas over the
 * game and ignores the pointer. It does nothing under `prefers-reduced-motion`.
 */
export function celebrate(origin: Point, board: Rect): void {
  const toRatio = ({ x, y }: Point) => ({ x: x / window.innerWidth, y: y / window.innerHeight });
  const base = { colors: CONFETTI_COLORS, disableForReducedMotion: true, ticks: 140, zIndex: 60 };

  void confetti({
    ...base,
    origin: toRatio(origin),
    particleCount: 60,
    spread: 80,
    startVelocity: 32,
    scalar: 0.9,
  });
  window.setTimeout(() => {
    const y = board.y + board.height * 0.9;
    void confetti({
      ...base,
      origin: toRatio({ x: board.x + board.width * 0.08, y }),
      angle: 60,
      particleCount: 45,
      spread: 55,
      startVelocity: 45,
    });
    void confetti({
      ...base,
      origin: toRatio({ x: board.x + board.width * 0.92, y }),
      angle: 120,
      particleCount: 45,
      spread: 55,
      startVelocity: 45,
    });
  }, 180);
}
