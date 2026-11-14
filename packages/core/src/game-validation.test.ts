import { describe, expect, it } from "vitest";
import { parseLearningGameResult, parseLearningLaunch } from "./game-validation";

const game = { id: "odd-one-out", levels: 2, roundsPerSession: 4 };
const result = {
  gameId: game.id,
  level: 1,
  rounds: 4,
  mistakes: 2,
  corrections: 1,
  durationMs: 1000,
};

describe("catalog-bound learning results", () => {
  it("accepts complete first-try and corrected sessions, with a canonical field order", () => {
    expect(parseLearningGameResult(result, game)).toEqual(result);
    expect(
      parseLearningGameResult({ ...result, mistakes: 0, corrections: 0, durationMs: 0 }, game),
    ).not.toBeNull();
    expect(
      parseLearningGameResult(
        { durationMs: 1000, corrections: 1, mistakes: 2, rounds: 4, level: 1, gameId: game.id },
        game,
      ),
    ).toEqual(result);
  });
  it("rejects fabricated rewards, partial rounds, wrong games/levels and impossible counters", () => {
    for (const invalid of [
      null,
      [],
      {},
      { ...result, stars: 999 },
      { ...result, childId: "someone-else" },
      { ...result, gameId: "other" },
      { ...result, level: 3 },
      { ...result, level: 1.5 },
      { ...result, rounds: 0 },
      { ...result, rounds: 4000 },
      { ...result, mistakes: 0 },
      { ...result, corrections: 0 },
      { ...result, corrections: 5, mistakes: 5 },
      { ...result, mistakes: -1 },
      { ...result, mistakes: Number.MAX_SAFE_INTEGER + 1 },
      { ...result, durationMs: Number.NaN },
      { ...result, durationMs: -1 },
      { ...result, durationMs: 1.1 },
    ])
      expect(parseLearningGameResult(invalid, game)).toBeNull();
  });
  it("validates launches without silently clamping or accepting client identities", () => {
    expect(parseLearningLaunch({ gameId: game.id, level: 2, seed: 0 }, game)).toEqual({
      gameId: game.id,
      level: 2,
      seed: 0,
    });
    expect(parseLearningLaunch({ gameId: game.id, level: 1 }, game)).toEqual({
      gameId: game.id,
      level: 1,
    });
    for (const invalid of [
      { gameId: game.id, level: 0 },
      { gameId: game.id, level: 3 },
      { gameId: "other", level: 1 },
      { gameId: game.id, level: 1, seed: Number.POSITIVE_INFINITY },
      { gameId: game.id, level: 1, seed: -1 },
      { gameId: game.id, level: 1, childId: "other" },
    ])
      expect(parseLearningLaunch(invalid, game)).toBeNull();
  });
});
