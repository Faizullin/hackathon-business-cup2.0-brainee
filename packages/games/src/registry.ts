import { manifests } from "@brainee/game-catalog";
// React entry points stay in code; embedded metadata comes from the same manifests as DB seed.

import { continuePattern } from "./continue-pattern";
import type { GameDefinition } from "./kit";
import { oddOneOut } from "./odd-one-out";

export const reactGames: readonly GameDefinition[] = [oddOneOut, continuePattern];
export const allGames: readonly GameDefinition[] = [
  ...reactGames,
  ...manifests
    .filter((game) => game.runtime === "embedded")
    .map((game): GameDefinition => ({ ...game, runtime: "embedded", runtimeUrl: game.entry })),
];

export function getGame(id: string): GameDefinition | undefined {
  return allGames.find((game) => game.id === id);
}
