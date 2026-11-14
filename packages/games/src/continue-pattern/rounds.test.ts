import { describe, expect, it } from "vitest";
import { generateRounds } from "./rounds";

describe("pattern rounds", () => {
  it("replays seeds and varies round/option order", () => {
    expect(generateRounds(1, 42)).toEqual(generateRounds(1, 42));
    expect(generateRounds(1, 42)).not.toEqual(generateRounds(1, 43));
    expect(generateRounds(1, 42)).not.toEqual(generateRounds(2, 42));
  });
  it.each([1, 2])("level %i has four playable rounds with unique choices", (level) => {
    for (let seed = 0; seed < 30; seed++) {
      const rounds = generateRounds(level, seed);
      expect(rounds).toHaveLength(4);
      for (const round of rounds) {
        expect(round.options).toHaveLength(3);
        expect(new Set(round.options.map((option) => JSON.stringify(option))).size).toBe(3);
        expect(round.options[round.answerIndex]).toBeDefined();
        expect(round.sequence.length).toBeGreaterThanOrEqual(4);
      }
    }
  });
  it("level 1 answers extend the shortest repeating visible motif", () => {
    for (const round of generateRounds(1, 42)) {
      const sequence = round.sequence.map((shape) => JSON.stringify(shape));
      const period = Array.from({ length: Math.ceil(sequence.length / 2) }, (_, i) => i + 1).find(
        (length) => sequence.every((shape, i) => shape === sequence[i % length]),
      );
      expect(period).toBeDefined();
      expect(JSON.stringify(round.options[round.answerIndex])).toBe(
        sequence[sequence.length % (period as number)],
      );
    }
  });
  it("level 2 continues repeated groups and simultaneous shape/color rules", () => {
    for (const round of generateRounds(2, 7)) {
      const [first, second, third] = round.sequence;
      const last = round.sequence.at(-1);
      if (!first || !second || !third || !last) throw new Error("Missing sequence");
      let expected = first;
      if (first.shape === "triangle") expected = { ...last, scale: third.scale };
      else if (first.shape === "square") expected = { ...third, color: last.color };
      else if (third.shape === "circle") expected = { ...first, color: second.color };
      expect(round.options[round.answerIndex]).toEqual(expected);
    }
  });
});
