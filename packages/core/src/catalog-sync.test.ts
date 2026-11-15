import { expect, it } from "vitest";
import { syncCatalog } from "./catalog-sync";
import type { Showcase } from "./showcase";

type Catalog = Pick<Showcase, "science" | "fun">;

const catalog = {
  science: [{ id: "film" }, { id: "old", position: 0 }],
  fun: [{ id: "snake", forever: false }],
} as unknown as Catalog;

it("adds missing catalog items in catalog order and keeps saved progress", () => {
  const saved = {
    science: [{ id: "old", position: 7 }],
    fun: [{ id: "snake", forever: true }],
  } as unknown as Catalog;
  const { showcase, changed } = syncCatalog(saved, catalog);
  expect(changed).toBe(true);
  expect(showcase.science).toEqual([{ id: "film" }, { id: "old", position: 7 }]);
  expect(showcase.fun).toEqual([{ id: "snake", forever: true }]);
});

it("drops saved items the catalog no longer has", () => {
  const saved = {
    science: [{ id: "bees", position: 3 }, { id: "film" }, { id: "old", position: 7 }],
    fun: [
      { id: "snake", forever: true },
      { id: "rocket", forever: true },
    ],
  } as unknown as Catalog;
  const { showcase, changed } = syncCatalog(saved, catalog);
  expect(changed).toBe(true);
  expect(showcase.science).toEqual([{ id: "film" }, { id: "old", position: 7 }]);
  expect(showcase.fun).toEqual([{ id: "snake", forever: true }]);
});

it("is a no-op when saved lists already match the catalog", () => {
  const saved = structuredClone(catalog);
  const result = syncCatalog(saved, catalog);
  expect(result.changed).toBe(false);
  expect(result.showcase).toBe(saved);
});

const explore = (over: object = {}) => ({
  id: "cube-hop",
  kind: "explore",
  title: "Cube Hop",
  thumbnail: "/g/cube-hop/0.1.0/thumbnail.svg",
  minAge: 5,
  priceTimed: 20,
  priceForever: 200,
  forever: false,
  ...over,
});

it("Explore games for ★ take catalog facts but keep the family's ownership and time", () => {
  const saved = {
    science: [],
    fun: [explore({ title: "Old", forever: true, remainingSeconds: 30 })],
  } as unknown as Catalog;
  const next = { science: [], fun: [explore({ thumbnail: "/g/cube-hop/0.2.0/t.svg" })] };
  const { showcase, changed } = syncCatalog(saved, next as unknown as Catalog);
  expect(changed).toBe(true);
  expect(showcase.fun[0]).toMatchObject({
    title: "Cube Hop",
    thumbnail: "/g/cube-hop/0.2.0/t.svg",
    forever: true,
    remainingSeconds: 30,
  });
  expect(syncCatalog(showcase, next as unknown as Catalog).changed).toBe(false);
});

it("a paid Explore game survives a missing remote catalog; an unpaid one is dropped", () => {
  const saved = {
    science: [],
    fun: [
      { id: "snake", forever: true },
      explore({ forever: true }),
      explore({ id: "unpaid" }),
      explore({ id: "timed", remainingSeconds: 120 }),
    ],
  } as unknown as Catalog;
  const { showcase } = syncCatalog(saved, catalog);
  expect(showcase.fun.map((g) => g.id)).toEqual(["snake", "cube-hop", "timed"]);
});
