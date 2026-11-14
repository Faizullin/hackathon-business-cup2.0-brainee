import { manifests } from "@brainee/game-catalog";
import type { GameDefinition } from "./kit";
// React folders register themselves (default export); embedded metadata comes from the same
// discovered manifests as the DB seed. See scripts/discover-games.mjs.
import { discoveredReactGames } from "./react-games.generated";

export const reactGames: readonly GameDefinition[] = discoveredReactGames;
export const allGames: readonly GameDefinition[] = [
  ...reactGames,
  ...manifests
    .filter((game) => game.runtime === "embedded")
    .map((game): GameDefinition => ({ ...game, runtime: "embedded", runtimeUrl: game.entry })),
];

export function getGame(id: string): GameDefinition | undefined {
  return allGames.find((game) => game.id === id);
}
