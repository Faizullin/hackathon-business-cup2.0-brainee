import { describe, expect, it } from "vitest";
import { generateRounds, ROUNDS_PER_LEVEL } from "./rounds";

describe("odd-one-out rounds", () => {
  it("is deterministic per level and seed", () => {
    expect(generateRounds(1, 42)).toEqual(generateRounds(1, 42));
    expect(generateRounds(1, 42)).not.toEqual(generateRounds(1, 43));
    expect(generateRounds(1, 42)).not.toEqual(generateRounds(2, 42));
  });

  it.each([
    [1, 9],
    [2, 12],
  ])("level %i has 4 rounds of %i cells", (level, cells) => {
    const rounds = generateRounds(level, 7);
    expect(rounds).toHaveLength(ROUNDS_PER_LEVEL);
    for (const round of rounds) {
      expect(round.cells).toBe(cells);
      expect(round.oddIndex).toBeGreaterThanOrEqual(0);
      expect(round.oddIndex).toBeLessThan(cells);
    }
  });

  it("makes the odd shape differ in exactly the stated attribute", () => {
    for (const seed of [1, 2, 3, 99, 2026]) {
      for (const level of [1, 2]) {
        for (const r of generateRounds(level, seed)) {
          const changed = [
            r.base.color !== r.odd.color && "color",
            r.base.shape !== r.odd.shape && "shape",
            r.base.scale !== r.odd.scale && "size",
          ].filter(Boolean);
          expect(changed).toEqual([r.difference]);
        }
      }
    }
  });

  it("keeps level 1 obvious and level 2 mostly about size", () => {
    expect(
      generateRounds(1, 5)
        .map((r) => r.difference)
        .sort(),
    ).toEqual(["color", "color", "shape", "shape"]);
    expect(generateRounds(2, 5).filter((r) => r.difference === "size")).toHaveLength(3);
  });
});
