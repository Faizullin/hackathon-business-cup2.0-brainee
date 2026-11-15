import type { FunGame } from "@brainee/core";
import { previews } from "@brainee/game-catalog";

/** Explore games are sold for ★ like Snake: 10 minutes or forever (the unlock-fun action, D-44). */
export const EXPLORE_PRICES = { timed: 20, forever: 200 } as const;

export type PreviewLike = { id: string; title: string; thumbnail: string; minAge: number };

export const SNAKE: FunGame = {
  id: "snake",
  title: "Snake",
  skill: "Spatial thinking",
  icon: "snake",
  priceTimed: 30,
  priceForever: 500,
  forever: true,
  until: null,
};

export function exploreFun(game: PreviewLike): FunGame {
  return {
    id: game.id,
    title: game.title,
    skill: "Explore",
    icon: "play",
    kind: "explore",
    thumbnail: game.thumbnail,
    minAge: game.minAge,
    priceTimed: EXPLORE_PRICES.timed,
    priceForever: EXPLORE_PRICES.forever,
    forever: false,
    until: null,
  };
}

/** Fun games that ship with the code: every built-in Explore preview, then Snake last. */
export const builtInFun = (): FunGame[] => [...previews.map(exploreFun), structuredClone(SNAKE)];
