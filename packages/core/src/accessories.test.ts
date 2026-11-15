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

describe("Hero Cape (Starter Pack)", () => {
  it("lives in its own back slot and never replaces other items", async () => {
    const { SLOTS } = await import("./accessories");
    expect(SLOTS).toContain("back");
    const worn = equip(equip({}, "cap"), "cape");
    expect(worn).toEqual({ head: "cap", back: "cape" });
    expect(equip(worn, "cowboy")).toEqual({ head: "cowboy", back: "cape" });
    expect(unequip(worn, "back")).toEqual({ head: "cap" });
  });
  it("is exclusive: it cannot be bought and the shop never lists it", async () => {
    const { SHOP_ACCESSORIES, isExclusive } = await import("./accessories");
    expect(isExclusive("cape")).toBe(true);
    expect(SHOP_ACCESSORIES.some((a) => a.id === "cape")).toBe(false);
    expect(SHOP_ACCESSORIES).toHaveLength(6);
    expect(buyAccessory({ stars: 999, suns: 0 }, [], "cape")).toEqual({
      ok: false,
      reason: "exclusive",
    });
  });
});
