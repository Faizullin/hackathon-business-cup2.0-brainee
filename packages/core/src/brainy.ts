// Brainy stages, mood and stat changes. Spec: docs/product/mechanics.md#brainy.
import type { BodyStat, BrainyStats } from "./types";

export const BODY_STATS = [
  "brain",
  "eyes",
  "mouth",
  "arms",
  "legs",
] as const satisfies readonly BodyStat[];

/** Thresholds on the average of the five body stats (prototype STAGES). */
export const STAGES = [
  { id: "sleepy", min: 0 },
  { id: "awake", min: 25 },
  { id: "lively", min: 40 },
  { id: "smart", min: 55 },
  { id: "genius", min: 70 },
] as const;

export type StageId = (typeof STAGES)[number]["id"];

export const MOOD_PER_GAME = 8;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function bodyAverage(stats: Pick<BrainyStats, BodyStat>) {
  return BODY_STATS.reduce((sum, key) => sum + stats[key], 0) / BODY_STATS.length;
}

export function stageOf(stats: Pick<BrainyStats, BodyStat>) {
  const average = bodyAverage(stats);
  let index = 0;
  STAGES.forEach((stage, i) => {
    if (average >= stage.min) index = i;
  });
  const current = STAGES[index] ?? STAGES[0];
  const next = STAGES[index + 1];
  return {
    index,
    id: current.id as StageId,
    average,
    next: (next?.id ?? null) as StageId | null,
    pointsToNext: next ? Math.ceil(next.min - average) : 0,
    progress: next ? (average - current.min) / (next.min - current.min) : 1,
  };
}

/** Mood rises with each finished game; Brainy never drops below 0 (and never dies). */
export const moodAfterGame = (mood: number) => clamp(mood + MOOD_PER_GAME, 0, 100);

/** Adds stat gains, keeping every stat within 0–100. The gain formula itself is T-24. */
export function applyStatGains(stats: BrainyStats, gains: Partial<BrainyStats>): BrainyStats {
  const result = { ...stats };
  for (const [key, gain] of Object.entries(gains) as [keyof BrainyStats, number][]) {
    result[key] = clamp(result[key] + gain, 0, 100);
  }
  return result;
}

/** A celebration only when a higher body stage is reached. */
export function reachedStage(before: BrainyStats, after: BrainyStats) {
  const next = stageOf(after);
  return next.index > stageOf(before).index ? next.id : null;
}

/** Representative stats for visual stage previews; never applied to a child's saved state. */
export function stagePreviewStats(id: StageId): BrainyStats {
  const index = STAGES.findIndex((stage) => stage.id === id);
  const stage = STAGES[index];
  if (!stage) throw new RangeError("Unknown stage.");
  const point = Math.floor((stage.min + (STAGES[index + 1]?.min ?? 101) - 1) / 2);
  return { brain: point, eyes: point, mouth: point, arms: point, legs: point, resp: point };
}
