import { describe, expect, it } from "vitest";
import {
  buyGift,
  completeLearningGame,
  exchangeSuns,
  newStreak,
  roundStars,
  sessionStars,
  stopForToday,
} from "./economy";

describe("star rules", () => {
  it("pays +3 first try, +4 after a correction, 0 for a wrong answer", () => {
    expect(roundStars({ correct: true, afterMistake: false })).toBe(3);
    expect(roundStars({ correct: true, afterMistake: true })).toBe(4);
    expect(roundStars({ correct: false, afterMistake: true })).toBe(0);
  });

  it("sums a session from rounds and corrections", () => {
    expect(sessionStars({ rounds: 4, corrections: 0 })).toBe(12);
    expect(sessionStars({ rounds: 4, corrections: 1 })).toBe(13);
    expect(sessionStars({ rounds: 4, corrections: 4 })).toBe(16);
  });

  it("rejects impossible sessions", () => {
    expect(() => sessionStars({ rounds: 2, corrections: 3 })).toThrow(RangeError);
    expect(() => sessionStars({ rounds: -1, corrections: 0 })).toThrow(RangeError);
    expect(() => sessionStars({ rounds: 1.5, corrections: 0 })).toThrow(RangeError);
  });
});

describe("three games in a row", () => {
  it("pays +5 once at the third game and suggests a break from then on", () => {
    let streak = newStreak();
    const results = [1, 2, 3, 4].map(() => {
      const step = completeLearningGame(streak);
      streak = step.streak;
      return step;
    });
    expect(results.map((r) => r.bonus)).toEqual([0, 0, 5, 0]);
    expect(results.map((r) => r.suggestBreak)).toEqual([false, false, true, true]);
  });

  it("stopping resets the run but not the one-time bonus", () => {
    const stopped = stopForToday({ inRow: 3, bonusGiven: true });
    expect(stopped).toEqual({ inRow: 0, bonusGiven: true });
  });
});

describe("wallet", () => {
  it("exchanges suns to stars at 1:10, one way only", () => {
    expect(exchangeSuns({ stars: 340, suns: 6 }, 2)).toEqual({
      ok: true,
      wallet: { stars: 360, suns: 4 },
    });
    expect(exchangeSuns({ stars: 340, suns: 1 }, 2)).toEqual({
      ok: false,
      reason: "not-enough-suns",
    });
    expect(exchangeSuns({ stars: 340, suns: 6 }, 0)).toEqual({
      ok: false,
      reason: "invalid-amount",
    });
    expect(exchangeSuns({ stars: 340, suns: 6 }, -1)).toEqual({
      ok: false,
      reason: "invalid-amount",
    });
  });

  it("buys gifts with suns only and leaves stars untouched", () => {
    expect(buyGift({ stars: 999, suns: 10 }, 10)).toEqual({
      ok: true,
      wallet: { stars: 999, suns: 0 },
    });
    expect(buyGift({ stars: 999, suns: 2 }, 3)).toEqual({ ok: false, reason: "not-enough-suns" });
  });

  it("refuses corrupt wallets", () => {
    expect(() => exchangeSuns({ stars: -1, suns: 2 }, 1)).toThrow(RangeError);
  });
});
