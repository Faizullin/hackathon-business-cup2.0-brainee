import type { Showcase } from "@brainee/core";
import { previews } from "@brainee/game-catalog";
import { exploreFun, type PreviewLike, SNAKE } from "./fun-catalog";
import { demoShowcase } from "./showcase-seed";

export { EXPLORE_PRICES, exploreFun } from "./fun-catalog";

let remote: PreviewLike[] = [];

/**
 * Remote Explore games (D-42) come from the cached R2 catalog that the web app reads before each
 * request; built-in previews ship with the code. Both join the family's fun list on its next read.
 */
export function setRemotePreviews(list: readonly PreviewLike[]) {
  remote = list.filter((game) => !previews.some((p) => p.id === game.id));
}

/** What every family's leisure lists are synced to: films, Snake and all Explore games (D-44). */
export function leisureCatalog(): Pick<Showcase, "science" | "fun"> {
  // Explore games first (built-in, then remote); Snake is the last option in the shop.
  const fun = [...previews, ...remote].map(exploreFun);
  return { science: demoShowcase.science, fun: [...fun, structuredClone(SNAKE)] };
}
