import { MAX_LEVEL } from "./levels.ts";

/**
 * What `progress.save` stores: where the child is, nothing about how they did.
 * A `type`, not an `interface`, so it is assignable to the bridge's `JsonValue`.
 */
export type SortProgress = {
  level: number;
  /** Rounds completed at this level so far. */
  solvedAtLevel: number;
};

/** Rounds completed at a level before the next level opens. */
export const ROUNDS_PER_LEVEL = 2;

export const START: SortProgress = { level: 1, solvedAtLevel: 0 };

const wholeNumber = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
    ? value
    : fallback;

/** Saved progress from the host, or the start when it is missing or malformed. */
export function parseProgress(saved: unknown): SortProgress {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return { ...START };
  const value = saved as Record<string, unknown>;
  return {
    level: wholeNumber(value.level, 1, MAX_LEVEL, START.level),
    solvedAtLevel: wholeNumber(value.solvedAtLevel, 0, ROUNDS_PER_LEVEL - 1, START.solvedAtLevel),
  };
}

/** After a completed round: one more at this level, and the next level every few. */
export function advanceProgress(progress: SortProgress): SortProgress {
  const solved = progress.solvedAtLevel + 1;
  if (solved >= ROUNDS_PER_LEVEL && progress.level < MAX_LEVEL) {
    return { level: progress.level + 1, solvedAtLevel: 0 };
  }
  return { level: progress.level, solvedAtLevel: solved % ROUNDS_PER_LEVEL };
}
