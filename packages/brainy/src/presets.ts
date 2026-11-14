import type { BrainyStats } from "@brainee/core";

/** Demo scenarios from the prototype (lines 659–661); also the basis for T-51 seeds. */
export const BRAINY_PRESETS = {
  afterQuiz: { brain: 18, eyes: 16, mouth: 14, arms: 14, legs: 18, resp: 10 },
  now: { brain: 66, eyes: 41, mouth: 55, arms: 70, legs: 64, resp: 80 },
  onlyFun: { brain: 12, eyes: 32, mouth: 34, arms: 96, legs: 88, resp: 20 },
} as const satisfies Record<string, BrainyStats>;

export type BrainyPreset = keyof typeof BRAINY_PRESETS;
