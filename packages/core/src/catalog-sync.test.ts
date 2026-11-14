import { expect, it } from "vitest";
import { syncCatalog } from "./catalog-sync";
import type { Showcase } from "./showcase";

type Catalog = Pick<Showcase, "science" | "cartoons" | "fun">;

const catalog = {
  science: [{ id: "film" }, { id: "old", position: 0 }],
  cartoons: [{ id: "c1", owned: false }],
  fun: [{ id: "snake", forever: false }],
} as unknown as Catalog;

it("adds missing catalog items in catalog order and keeps saved progress", () => {
  const saved = {
    science: [{ id: "old", position: 7 }],
    cartoons: [{ id: "c1", owned: true }],
    fun: [{ id: "snake", forever: true }],
  } as unknown as Catalog;
  const { showcase, changed } = syncCatalog(saved, catalog);
  expect(changed).toBe(true);
  expect(showcase.science).toEqual([{ id: "film" }, { id: "old", position: 7 }]);
  expect(showcase.cartoons).toEqual([{ id: "c1", owned: true }]);
  expect(showcase.fun).toEqual([{ id: "snake", forever: true }]);
});

it("is a no-op when nothing is missing", () => {
  const saved = structuredClone(catalog);
  const result = syncCatalog(saved, catalog);
  expect(result.changed).toBe(false);
  expect(result.showcase).toBe(saved);
});
