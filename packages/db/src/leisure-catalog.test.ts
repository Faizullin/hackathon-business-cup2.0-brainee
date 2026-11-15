import { previews } from "@brainee/game-catalog";
import { afterEach, expect, it } from "vitest";
import { EXPLORE_PRICES, leisureCatalog, setRemotePreviews } from "./leisure-catalog";

afterEach(() => setRemotePreviews([]));

it("sells Snake and every built-in Explore game for ★", () => {
  const { fun } = leisureCatalog();
  expect(fun.at(-1)?.id).toBe("snake");
  for (const game of previews)
    expect(fun.find((g) => g.id === game.id)).toMatchObject({
      kind: "explore",
      thumbnail: game.thumbnail,
      minAge: game.minAge,
      priceTimed: EXPLORE_PRICES.timed,
      priceForever: EXPLORE_PRICES.forever,
      forever: false,
    });
});

it("adds remote Explore games once, never duplicating a built-in id", () => {
  const builtIn = previews[0];
  if (!builtIn) throw new Error("expected built-in previews");
  setRemotePreviews([
    { id: "cube-hop", title: "Cube Hop", thumbnail: "/g/cube-hop/0.1.0/thumbnail.svg", minAge: 5 },
    { ...builtIn, title: "Shadow copy" },
  ]);
  const ids = leisureCatalog().fun.map((g) => g.id);
  expect(ids).toContain("cube-hop");
  expect(ids.filter((id) => id === builtIn.id)).toHaveLength(1);
});
