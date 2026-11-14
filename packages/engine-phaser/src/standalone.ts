import { contextFromUrl, type GameBridgeOptions, type GameContract } from "@brainee/game-bridge";
import type { Game } from "phaser";
import { connectPhaserBridge } from "./bridge";
import { createPhaserGame, type PhaserCoreGameOptions } from "./createPhaserGame";

/** Bridge settings for a standalone build; `contract` defaults to `<gameId>@1`. */
export type StandaloneBridgeOptions<C extends GameContract> = Partial<
  Omit<GameBridgeOptions<C>, "adapter" | "fallback">
>;

/**
 * Starts a package's standalone HTML5 build in its `#game-container`, the way
 * the store's iframes run it, connects it to the host over the game bridge
 * (scenes reach it as `BridgedScene#bridge`) and reports `ready` once booted.
 */
export function startStandaloneGame<C extends GameContract = GameContract>(
  gameId: string,
  options: Omit<PhaserCoreGameOptions, "parent">,
  bridgeOptions: StandaloneBridgeOptions<C> = {},
): Game {
  const game = createPhaserGame({ parent: "game-container", ...options });

  const bridge = connectPhaserBridge<C>(game, {
    contract: `${gameId}@1`,
    ...bridgeOptions,
    fallback: () => ({ context: { gameId, ...contextFromUrl() } }),
  });
  // Scenes report ready after their assets and launch config are available.
  const destroy = () => {
    bridge.close();
    game.destroy(true);
  };
  window.addEventListener("pagehide", destroy, { once: true });
  game.events.once("destroy", () => {
    bridge.close();
    window.removeEventListener("pagehide", destroy);
  });
  return game;
}
