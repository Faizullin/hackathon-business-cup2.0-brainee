import type { Showcase } from "./showcase";

type CatalogKey = "science" | "fun";
const CATALOG_KEYS: readonly CatalogKey[] = ["science", "fun"];

/**
 * Makes a family's saved leisure lists (films, fun games) match the catalog, in the catalog's
 * order. Missing items are added; items the catalog no longer has (removed placeholders) are
 * dropped. Items in both keep the family's own progress and ownership, so families created
 * before a catalog change get it on their next read.
 */
export function syncCatalog<T extends Pick<Showcase, CatalogKey>>(
  showcase: T,
  catalog: Pick<Showcase, CatalogKey>,
) {
  let changed = false;
  const next = { ...showcase };
  for (const key of CATALOG_KEYS) {
    const saved = showcase[key] as { id: string }[];
    const items = catalog[key] as { id: string }[];
    const byId = new Map(saved.map((item) => [item.id, item]));
    const merged = items.map((item) => byId.get(item.id) ?? structuredClone(item));
    const same =
      merged.length === saved.length && merged.every((item, index) => item === saved[index]);
    if (same) continue;
    changed = true;
    (next as Record<CatalogKey, unknown>)[key] = merged;
  }
  return { showcase: changed ? (next as T) : showcase, changed };
}
