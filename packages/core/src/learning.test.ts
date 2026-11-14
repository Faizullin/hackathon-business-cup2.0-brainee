import { describe, expect, it } from "vitest";
import { newStreak } from "./economy";
import {
  finishLearningSession,
  isLearningProgress,
  type LearningProgress,
  practiceGame,
  stopLearningSession,
} from "./learning";
import { quizStart } from "./onboarding";
import type { SkillWeights } from "./stat-gains";
import type { GameResult } from "./types";

const ODD: SkillWeights = { attention: 1 };
const PATTERN: SkillWeights = { logic: 0.7, attention: 0.3 };

const initial = (): LearningProgress => ({
  stats: { brain: 66, eyes: 41, mouth: 55, arms: 70, legs: 64, resp: 80 },
  skills: { speech: 62, reading: 48, logic: 78, attention: 41, memory: 55, motor: 70 },
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
    const completion = finishLearningSession(before, result, ODD);
    expect(completion.after).toMatchObject({
      stats: { eyes: 44 },
      wallet: { stars: 352, suns: 6 },
      mood: 80,
      streak: { inRow: 1, bonusGiven: false },
    });
    expect(completion.gains).toEqual({ eyes: 3 });
    expect(completion.skillGains).toEqual({ attention: 3 });
    expect(completion.after.skills.attention).toBe(44);
    expect(before).toEqual(initial());
  });
  it("pays the third-game bonus once, including after a stop", () => {
    let progress = initial();
    for (let i = 1; i <= 4; i++) {
      const completion = finishLearningSession(progress, result, ODD);
      expect(completion.bonus).toBe(i === 3 ? 5 : 0);
      expect(completion.suggestBreak).toBe(i >= 3);
      progress = completion.after;
    }
    progress = stopLearningSession(progress);
    expect(progress.streak).toEqual({ inRow: 0, bonusGiven: true });
    for (let i = 0; i < 3; i++) {
      const completion = finishLearningSession(progress, result, ODD);
      expect(completion.bonus).toBe(0);
      progress = completion.after;
    }
    expect(progress.wallet.stars).toBe(340 + 7 * 12 + 5);
  });
  it("uses actual capped gains and counts correction rewards", () => {
    const before = initial();
    before.stats.eyes = 99;
    before.mood = 99;
    const completion = finishLearningSession(
      before,
      { ...result, corrections: 1, mistakes: 1 },
      ODD,
    );
    expect(completion.gains).toEqual({ eyes: 1 });
    expect(completion.earnedStars).toBe(13);
    expect(completion.after.mood).toBe(100);
    // Weighted split: 70% logic → brain, 30% attention → eyes; level 2 adds budget.
    const pattern = finishLearningSession(
      initial(),
      { ...result, gameId: "continue-pattern" },
      PATTERN,
    );
    expect(pattern.skillGains).toEqual({ logic: 2, attention: 1 });
    expect(pattern.gains).toEqual({ brain: 2, eyes: 1 });
    const level2 = finishLearningSession(initial(), { ...result, level: 2 }, ODD);
    expect(level2.skillGains).toEqual({ attention: 4 });
  });
  it("refuses corrupt progress and invalid weights", () => {
    expect(isLearningProgress(initial())).toBe(true);
    expect(isLearningProgress({ ...initial(), wallet: { stars: -1, suns: 0 } })).toBe(false);
    expect(isLearningProgress({ ...initial(), stats: { eyes: 10 } })).toBe(false);
    expect(isLearningProgress(null)).toBe(false);
    expect(() => finishLearningSession(initial(), result, { attention: 0.5 })).toThrow(RangeError);
    expect(() => finishLearningSession(initial(), result, { flying: 1 } as SkillWeights)).toThrow(
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

describe("onboarding quiz", () => {
  it("starts Brainy sleepy/awake (≤ 40) and better answers start higher", () => {
    const low = quizStart({ hours: 0, content: 0, finish: 0, reaction: 0, reads: 0 });
    const high = quizStart({ hours: 3, content: 3, finish: 3, reaction: 3, reads: 3 });
    expect(Math.max(...Object.values(high.stats))).toBeLessThanOrEqual(40);
    expect(high.stats.brain).toBeGreaterThan(low.stats.brain);
    expect(high.skills.reading).toBeGreaterThan(low.skills.reading);
    expect(() => quizStart({ hours: 4 } as never)).toThrow(RangeError);
  });
});
