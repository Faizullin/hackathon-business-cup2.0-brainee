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
