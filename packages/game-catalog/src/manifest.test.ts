import { expect, it } from "vitest";
import { manifestSchema, manifests } from "./index";

it("validates all catalog entries and rejects foreign URLs and inconsistent weights", () => {
  expect(new Set(manifests.map((game) => game.id)).size).toBe(manifests.length);
  for (const game of manifests) expect(manifestSchema.safeParse(game).success).toBe(true);
  const embedded = manifests.find((game) => game.runtime === "embedded");
  expect(manifestSchema.safeParse({ ...embedded, entry: "https://example.com/game" }).success).toBe(
    false,
  );
  expect(manifestSchema.safeParse({ ...embedded, weights: { motor: 0.1 } }).success).toBe(false);
});
