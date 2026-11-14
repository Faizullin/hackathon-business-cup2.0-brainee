import { MAX_LEVEL } from "./levels.ts";

/**
 * What `progress.save` stores: where the child is, nothing about how they did.
 * A `type`, not an `interface`, so it is assignable to the bridge's `JsonValue`.
 */
export type PuzzleProgress = {
  level: number;
  /** Index into the picture catalog. */
  picture: number;
  /** Pictures completed at this level so far. */
  solvedAtLevel: number;
};

/** Pictures completed at a level before the next level opens. */
export const PICTURES_PER_LEVEL = 2;

export const START: PuzzleProgress = { level: 1, picture: 0, solvedAtLevel: 0 };

const wholeNumber = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
    ? value
    : fallback;

/** Saved progress from the host, or the start when it is missing or malformed. */
export function parseProgress(saved: unknown, pictureCount: number): PuzzleProgress {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return { ...START };
  const value = saved as Record<string, unknown>;
  return {
    level: wholeNumber(value.level, 1, MAX_LEVEL, START.level),
    picture: wholeNumber(value.picture, 0, pictureCount - 1, START.picture),
    solvedAtLevel: wholeNumber(value.solvedAtLevel, 0, PICTURES_PER_LEVEL - 1, START.solvedAtLevel),
  };
}

/** After a completed picture: the next picture, and the next level every few. */
export function advanceProgress(progress: PuzzleProgress, pictureCount: number): PuzzleProgress {
  const picture = (progress.picture + 1) % pictureCount;
  const solved = progress.solvedAtLevel + 1;
  if (solved >= PICTURES_PER_LEVEL && progress.level < MAX_LEVEL) {
    return { level: progress.level + 1, picture, solvedAtLevel: 0 };
  }
  return { level: progress.level, picture, solvedAtLevel: solved % PICTURES_PER_LEVEL };
}
