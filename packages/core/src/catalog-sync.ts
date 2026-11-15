import type { Showcase } from "./showcase";

type CatalogKey = "science" | "fun";
type FunLike = { id: string; kind?: string; forever?: boolean; remainingSeconds?: number };
const EXPLORE_FACTS = ["title", "thumbnail", "minAge", "priceTimed", "priceForever"] as const;
const pick = (item: object, keys: readonly string[]) =>
  Object.fromEntries(
    keys.filter((k) => k in item).map((k) => [k, (item as Record<string, unknown>)[k]]),
  );
const sameFacts = (a: object, b: object) =>
  EXPLORE_FACTS.every(
    (k) => (a as Record<string, unknown>)[k] === (b as Record<string, unknown>)[k],
  );
const isOwned = (item: FunLike) => !!item.forever || (item.remainingSeconds ?? 0) > 0;
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
    const merged = items.map((item) => {
      const own = byId.get(item.id);
      if (!own) return structuredClone(item);
      // Catalog facts (title, price, art) follow the catalog; progress and ownership stay.
      return key === "fun" && (item as { kind?: string }).kind === "explore"
        ? sameFacts(own, item)
          ? own
          : { ...own, ...pick(item, EXPLORE_FACTS) }
        : own;
    });
    // A paid Explore game survives a moment when its remote catalog is unreachable.
    if (key === "fun")
      for (const item of saved as FunLike[])
        if (item.kind === "explore" && isOwned(item) && !items.some((i) => i.id === item.id))
          merged.push(item);
    const same =
      merged.length === saved.length && merged.every((item, index) => item === saved[index]);
    if (same) continue;
    changed = true;
    (next as Record<CatalogKey, unknown>)[key] = merged;
  }
  return { showcase: changed ? (next as T) : showcase, changed };
}
