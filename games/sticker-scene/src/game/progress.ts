import { MAX_LEVEL } from "./levels.ts";

/**
 * What `progress.save` stores: where the child is, nothing about how they did.
 * A `type`, not an `interface`, so it is assignable to the bridge's `JsonValue`.
 */
export type StickerProgress = {
  level: number;
  /** Index into the scene catalog. */
  scene: number;
  /** Scenes completed at this level so far. */
  solvedAtLevel: number;
};

/** Scenes completed at a level before the next level opens. */
export const SCENES_PER_LEVEL = 2;

export const START: StickerProgress = { level: 1, scene: 0, solvedAtLevel: 0 };

const wholeNumber = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
    ? value
    : fallback;

/** Saved progress from the host, or the start when it is missing or malformed. */
export function parseProgress(saved: unknown, sceneCount: number): StickerProgress {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return { ...START };
  const value = saved as Record<string, unknown>;
  return {
    level: wholeNumber(value.level, 1, MAX_LEVEL, START.level),
    scene: wholeNumber(value.scene, 0, sceneCount - 1, START.scene),
    solvedAtLevel: wholeNumber(value.solvedAtLevel, 0, SCENES_PER_LEVEL - 1, START.solvedAtLevel),
  };
}

/** After a completed scene: the next scene, and the next level every few. */
export function advanceProgress(progress: StickerProgress, sceneCount: number): StickerProgress {
  const scene = (progress.scene + 1) % sceneCount;
  const solved = progress.solvedAtLevel + 1;
  if (solved >= SCENES_PER_LEVEL && progress.level < MAX_LEVEL) {
    return { level: progress.level + 1, scene, solvedAtLevel: 0 };
  }
  return { level: progress.level, scene, solvedAtLevel: solved % SCENES_PER_LEVEL };
}
