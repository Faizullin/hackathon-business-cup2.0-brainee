import { describe, expect, it } from "vitest";
import { buyAccessory, equip, unequip } from "./accessories";

describe("accessories", () => {
  it("keeps one item per slot", () => {
    let worn = equip({}, "cap");
    worn = equip(worn, "glasses");
    worn = equip(worn, "cowboy");
    expect(worn).toEqual({ head: "cowboy", face: "glasses" });
    expect(unequip(worn, "head")).toEqual({ face: "glasses" });
  });

  it("buys with stars only, once", () => {
    const bought = buyAccessory({ stars: 340, suns: 6 }, [], "cowboy");
    expect(bought).toEqual({ ok: true, wallet: { stars: 220, suns: 6 }, owned: ["cowboy"] });
    expect(buyAccessory({ stars: 340, suns: 6 }, ["cowboy"], "cowboy")).toEqual({
      ok: false,
      reason: "already-owned",
    });
    expect(buyAccessory({ stars: 10, suns: 99 }, [], "bowtie")).toEqual({
      ok: false,
      reason: "not-enough-stars",
    });
  });
});
