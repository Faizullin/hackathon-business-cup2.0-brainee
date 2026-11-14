import { isSkillWeights } from "@brainee/core";
import { describe, expect, it } from "vitest";
import { allGames } from "./registry";

describe("catalog metadata (D-22, D-23)", () => {
  it("every game has valid skill weights covering its trained skills and an age 4–10", () => {
    for (const game of allGames) {
      expect(isSkillWeights(game.weights)).toBe(true);
      expect(game.weights[game.skills.main as keyof typeof game.weights]).toBeGreaterThan(0);
      expect(game.minAge).toBeGreaterThanOrEqual(4);
      expect(game.minAge).toBeLessThanOrEqual(10);
    }
  });
});
