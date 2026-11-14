import { describe, expect, it } from "vitest";
import { createRng } from "./random";

describe("createRng", () => {
  it("repeats the same sequence for the same seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    expect(Array.from({ length: 5 }, () => a.next())).toEqual(
      Array.from({ length: 5 }, () => b.next()),
    );
  });

  it("differs between seeds and stays within bounds", () => {
    const rng = createRng(7);
    const values = Array.from({ length: 200 }, () => rng.int(1, 6));
    expect(values.every((v) => v >= 1 && v <= 6)).toBe(true);
    expect(new Set(values).size).toBe(6);
    expect(createRng(1).next()).not.toBe(createRng(2).next());
  });

  it("shuffles without losing items or mutating the input", () => {
    const input = [1, 2, 3, 4, 5];
    const shuffled = createRng(3).shuffle(input);
    expect([...shuffled].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect(() => createRng(1).pick([])).toThrow();
  });
});
