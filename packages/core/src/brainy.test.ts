import { describe, expect, it } from "vitest";
import { applyStatGains, bodyAverage, moodAfterGame, stageOf } from "./brainy";

// Prototype presets: START (after quiz), NOW, FUN (only entertainment).
const START = { brain: 18, eyes: 16, mouth: 14, arms: 14, legs: 18, resp: 10 };
const NOW = { brain: 66, eyes: 41, mouth: 55, arms: 70, legs: 64, resp: 80 };

describe("stages", () => {
  it("averages the five body stats, ignoring resp", () => {
    expect(bodyAverage(START)).toBe(16);
    expect(bodyAverage(NOW)).toBe(59.2);
  });

  it("maps the prototype presets to their stages", () => {
    expect(stageOf(START)).toMatchObject({ id: "sleepy", next: "awake", pointsToNext: 9 });
    expect(stageOf(NOW)).toMatchObject({ id: "smart", next: "genius", pointsToNext: 11 });
  });

  it("uses inclusive thresholds and caps at genius", () => {
    const at = (v: number) => ({ brain: v, eyes: v, mouth: v, arms: v, legs: v });
    expect(stageOf(at(25)).id).toBe("awake");
    expect(stageOf(at(24.9)).id).toBe("sleepy");
    expect(stageOf(at(100))).toMatchObject({
      id: "genius",
      next: null,
      pointsToNext: 0,
      progress: 1,
    });
    expect(stageOf(at(47.5)).progress).toBeCloseTo(0.5);
  });
});

describe("mood and stats", () => {
  it("adds 8 mood per finished game, capped at 100", () => {
    expect(moodAfterGame(72)).toBe(80);
    expect(moodAfterGame(96)).toBe(100);
  });

  it("applies gains within 0–100 without mutating the input", () => {
    const result = applyStatGains(NOW, { eyes: 3, arms: 40, resp: -100 });
    expect(result).toMatchObject({ eyes: 44, arms: 100, resp: 0 });
    expect(NOW.eyes).toBe(41);
  });
});

describe("mood decay", () => {
  it("fades 5 per idle day, never below 30, and not on the same day", async () => {
    const { moodNow } = await import("./onboarding");
    const last = new Date("2026-11-10T10:00:00Z");
    expect(moodNow(72, last, new Date("2026-11-10T23:00:00Z"))).toBe(72);
    expect(moodNow(72, last, new Date("2026-11-12T08:00:00Z"))).toBe(62);
    expect(moodNow(40, last, new Date("2026-11-20T08:00:00Z"))).toBe(30);
    expect(moodNow(20, last, new Date("2026-11-20T08:00:00Z"))).toBe(20);
  });
});
