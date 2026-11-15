import { MAX_LEVEL } from "./levels.ts";

export type Progress = { level: number; solvedAtLevel: number };
export const START: Progress = { level: 1, solvedAtLevel: 0 };
export function parseProgress(data: unknown): Progress {
  if (!data || typeof data !== "object" || Array.isArray(data)) return { ...START };
  const { level, solvedAtLevel } = data as Record<string, unknown>;
  const integer = (n: unknown, low: number, high: number, fallback: number) =>
    typeof n === "number" && Number.isInteger(n) && n >= low && n <= high ? n : fallback;
  return { level: integer(level, 1, MAX_LEVEL, 1), solvedAtLevel: integer(solvedAtLevel, 0, 1, 0) };
}
/** Keep the menu's chosen level until the player explicitly changes it. */
export function advanceProgress(p: Progress): Progress {
  return { level: p.level, solvedAtLevel: (p.solvedAtLevel + 1) % 2 };
}
