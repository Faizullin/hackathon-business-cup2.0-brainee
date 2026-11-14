import { createRng } from "@brainee/core";

import { COLORS, SHAPES, type ShapeSpec } from "../kit/shapes";

export type Difference = "color" | "shape" | "size";

export type OddRound = {
  /** 1-based round number, stable for React keys. */
  id: number;
  cells: number;
  base: ShapeSpec;
  odd: ShapeSpec;
  oddIndex: number;
  difference: Difference;
};

export const ROUNDS_PER_LEVEL = 4;

// Prototype: level 1 = 9 cells (color/shape), level 2 = 12 cells (mostly size, smaller gaps).
const PLAN: Record<1 | 2, { cells: number; differences: Difference[] }> = {
  1: { cells: 9, differences: ["color", "shape", "color", "shape"] },
  2: { cells: 12, differences: ["size", "size", "color", "size"] },
};

export function generateRounds(level: number, seed: number): OddRound[] {
  const plan = PLAN[level >= 2 ? 2 : 1];
  const rng = createRng(seed * 31 + level);
  return rng.shuffle(plan.differences).map((difference, i) => {
    const base: ShapeSpec = { shape: rng.pick(SHAPES), color: rng.pick(COLORS), scale: 1 };
    const odd: ShapeSpec = { ...base };
    if (difference === "color") odd.color = rng.pick(COLORS.filter((c) => c !== base.color));
    if (difference === "shape") odd.shape = rng.pick(SHAPES.filter((s) => s !== base.shape));
    if (difference === "size") odd.scale = rng.pick([0.78, 0.8]);
    return {
      id: i + 1,
      cells: plan.cells,
      base,
      odd,
      oddIndex: rng.int(0, plan.cells - 1),
      difference,
    };
  });
}
