// React games registered in code. Embedded games will come from the Game table (T-19/T-29).
import type { GameDefinition } from "./kit";
import { oddOneOut } from "./odd-one-out";

export const reactGames: readonly GameDefinition[] = [oddOneOut];

export function getGame(id: string): GameDefinition | undefined {
  return reactGames.find((game) => game.id === id);
}
