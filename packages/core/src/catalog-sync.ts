import type { Showcase } from "./showcase";

type CatalogKey = "science" | "cartoons" | "fun";
const CATALOG_KEYS: readonly CatalogKey[] = ["science", "cartoons", "fun"];

/**
 * Adds catalog items (films, videos, cartoons, fun games) that a family's saved showcase is
 * missing, in the catalog's order. Existing items keep the family's own progress and ownership.
 * Families created before new content shipped get it on their next read.
 */
export function syncCatalog<T extends Pick<Showcase, CatalogKey>>(
  showcase: T,
  catalog: Pick<Showcase, CatalogKey>,
) {
  let changed = false;
  const next = { ...showcase };
  for (const key of CATALOG_KEYS) {
    const saved = showcase[key] as { id: string }[];
    const known = new Set(saved.map((item) => item.id));
    const missing = (catalog[key] as { id: string }[]).filter((item) => !known.has(item.id));
    if (!missing.length) continue;
    changed = true;
    const order = new Map(
      (catalog[key] as { id: string }[]).map((item, index) => [item.id, index]),
    );
    const merged = [...saved, ...structuredClone(missing)];
    merged.sort(
      (a, b) =>
        (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    );
    (next as Record<CatalogKey, unknown>)[key] = merged;
  }
  return { showcase: changed ? (next as T) : showcase, changed };
}
