import { manifests, previews } from "@brainee/game-catalog";
import type { RemoteRecord } from "@brainee/game-catalog/remote";
import { readRemoteCatalog } from "@brainee/game-catalog/storage";

let cached: { until: number; rows: RemoteRecord[] } | undefined;
let pending: Promise<RemoteRecord[]> | undefined;
export async function remoteCatalog() {
  if (cached && cached.until > Date.now()) return cached.rows;
  pending ??= readRemoteCatalog()
    .then((rows) => {
      cached = { rows, until: Date.now() + 60000 };
      return rows;
    })
    .finally(() => {
      pending = undefined;
    });
  return pending;
}
export async function runtimeCatalog() {
  const remote = (await remoteCatalog().catch(() => []))
    .filter((r) => r.enabled)
    .map((r) => r.manifest);
  return {
    games: [...manifests, ...remote.filter((g) => g.scored)],
    previews: [...previews, ...remote.filter((g) => !g.scored)],
  };
}
