import { describe, expect, it } from "vitest";
import { newStreak } from "./economy";
import {
  finishLearningSession,
  isLearningProgress,
  type LearningProgress,
  practiceGame,
  stopLearningSession,
} from "./learning";
import type { GameResult } from "./types";

const initial = (): LearningProgress => ({
  stats: { brain: 66, eyes: 41, mouth: 55, arms: 70, legs: 64, resp: 80 },
  wallet: { stars: 340, suns: 6 },
  mood: 72,
  streak: newStreak(),
});
const result: GameResult = {
  gameId: "odd-one-out",
  level: 1,
  rounds: 4,
  mistakes: 0,
  corrections: 0,
  durationMs: 1000,
};

describe("learning completion", () => {
  it("computes the full immutable before/after preview", () => {
    const before = initial();
    const completion = finishLearningSession(before, result);
    expect(completion.after).toMatchObject({
      stats: { eyes: 44 },
      wallet: { stars: 352, suns: 6 },
      mood: 80,
      streak: { inRow: 1, bonusGiven: false },
    });
    expect(completion.gains).toEqual({ eyes: 3 });
    expect(before).toEqual(initial());
  });
  it("pays the third-game bonus once, including after a stop", () => {
    let progress = initial();
    for (let i = 1; i <= 4; i++) {
      const completion = finishLearningSession(progress, result);
      expect(completion.bonus).toBe(i === 3 ? 5 : 0);
      expect(completion.suggestBreak).toBe(i >= 3);
      progress = completion.after;
    }
    progress = stopLearningSession(progress);
    expect(progress.streak).toEqual({ inRow: 0, bonusGiven: true });
    for (let i = 0; i < 3; i++) {
      const completion = finishLearningSession(progress, result);
      expect(completion.bonus).toBe(0);
      progress = completion.after;
    }
    expect(progress.wallet.stars).toBe(340 + 7 * 12 + 5);
  });
  it("uses actual capped gains and counts correction rewards", () => {
    const before = initial();
    before.stats.eyes = 99;
    before.mood = 99;
    const completion = finishLearningSession(before, { ...result, corrections: 1, mistakes: 1 });
    expect(completion.gains).toEqual({ eyes: 1 });
    expect(completion.earnedStars).toBe(13);
    expect(completion.after.mood).toBe(100);
    expect(finishLearningSession(before, { ...result, gameId: "continue-pattern" }).gains).toEqual({
      brain: 2,
    });
  });
  it("refuses corrupt progress and unknown game policies", () => {
    expect(isLearningProgress(initial())).toBe(true);
    expect(isLearningProgress({ ...initial(), wallet: { stars: -1, suns: 0 } })).toBe(false);
    expect(isLearningProgress({ ...initial(), stats: { eyes: 10 } })).toBe(false);
    expect(isLearningProgress(null)).toBe(false);
    expect(() => finishLearningSession(initial(), { ...result, gameId: "unknown" })).toThrow(
      RangeError,
    );
  });
  it("chooses the available learning game for the weakest trained body stat", () => {
    const games = [
      { id: "pattern", kind: "dev", skills: { main: "logic" } },
      { id: "odd", kind: "dev", skills: { main: "attention" } },
      { id: "fun", kind: "fun", skills: { main: "speech" } },
    ] as const;
    expect(practiceGame(initial().stats, games)?.id).toBe("odd");
    expect(practiceGame(initial().stats, games.slice(0, 1))?.id).toBe("pattern");
    expect(practiceGame(initial().stats, [])).toBeUndefined();
  });
});
