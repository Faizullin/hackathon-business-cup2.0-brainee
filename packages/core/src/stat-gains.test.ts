import { describe, expect, it } from "vitest";
import { applyStatGains } from "./brainy";
import { abilityStatGains, sessionSkillGains } from "./stat-gains";
import type { GameResult } from "./types";

const result: GameResult = {
  gameId: "example",
  level: 2,
  rounds: 4,
  mistakes: 1,
  corrections: 1,
  durationMs: 1000,
};

describe("swappable session gains", () => {
  it("splits the supplied budget 70/30 without rounding away small gains", () => {
    const gains = sessionSkillGains(result, { main: "logic", secondary: "attention" }, () => 2);
    expect(gains.logic).toBeCloseTo(1.4);
    expect(gains.attention).toBeCloseTo(0.6);
    expect(abilityStatGains(gains)).toEqual({ brain: 1.4, eyes: 0.6 });
  });
  it("passes level and accuracy evidence to a replaceable policy", () => {
    const trained = { main: "memory" } as const;
    const samplePolicy = (session: Readonly<GameResult>) =>
      (session.level * (session.rounds - session.corrections)) / session.rounds;
    expect(sessionSkillGains(result, trained, samplePolicy)).toEqual({ memory: 1.5 });
    expect(sessionSkillGains({ ...result, corrections: 0 }, trained, samplePolicy)).toEqual({
      memory: 2,
    });
    expect(sessionSkillGains(result, trained, () => 10)).toEqual({ memory: 10 });
    expect(result.corrections).toBe(1);
  });
  it("does not lose gains for a single skill or two abilities sharing a body part", () => {
    expect(
      sessionSkillGains(result, { main: "attention", secondary: "attention" }, () => 2),
    ).toEqual({ attention: 2 });
    const gains = abilityStatGains(
      sessionSkillGains(result, { main: "logic", secondary: "memory" }, () => 10),
    );
    expect(gains).toEqual({ brain: 10 });
    expect(
      applyStatGains({ brain: 99, eyes: 41, mouth: 50, arms: 50, legs: 50, resp: 50 }, gains).brain,
    ).toBe(100);
    expect(
      sessionSkillGains(result, { main: "longGame", secondary: "learningMachine" }, () => 10),
    ).toEqual({ longGame: 7, learningMachine: 3 });
  });
  it("refuses invalid sessions and invalid gain policies", () => {
    for (const total of [-1, Number.NaN, Number.POSITIVE_INFINITY])
      expect(() => sessionSkillGains(result, { main: "logic" }, () => total)).toThrow(RangeError);
    for (const invalid of [
      { rounds: 0 },
      { corrections: 5 },
      { mistakes: 0 },
      { level: 0 },
      { durationMs: -1 },
    ])
      expect(() =>
        sessionSkillGains({ ...result, ...invalid }, { main: "logic" }, () => 1),
      ).toThrow(RangeError);
    expect(() => abilityStatGains({ attention: Number.NaN })).toThrow(RangeError);
  });
});
