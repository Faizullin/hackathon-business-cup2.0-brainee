import {
  type EngineAdapter,
  GameBridge,
  type GameBridgeOptions,
  type GameContract,
} from "@brainee/game-bridge";
import { type Game, Scene } from "phaser";

/** Where `startStandaloneGame` keeps the bridge, for `BridgedScene`. */
export const BRIDGE_REGISTRY_KEY = "gameBridge";

/** Pause, resume and restart from the first scene, as the host asks. */
export function phaserAdapter(game: Game): EngineAdapter {
  return {
    pause: () => game.pause(),
    resume: () => game.resume(),
    restart: () => {
      if (game.isPaused) game.resume();
      const [first] = game.scene.getScenes(false);
      for (const scene of game.scene.getScenes(true)) scene.scene.stop();
      if (first) game.scene.start(first.scene.key);
    },
    snapshot: () => ({
      engine: "phaser",
      scenes: game.scene.getScenes(true).map((scene) => ({
        key: scene.scene.key,
        objects: scene.children.length,
      })),
    }),
  };
}

/** Connects `game` to its host and keeps the bridge in the game registry. */
export function connectPhaserBridge<C extends GameContract>(
  game: Game,
  options: Omit<GameBridgeOptions<C>, "adapter">,
): GameBridge<C> {
  const bridge = GameBridge.connect<C>({ ...options, adapter: phaserAdapter(game) });
  game.registry.set(BRIDGE_REGISTRY_KEY, bridge);
  return bridge;
}

/** A scene with a typed `this.bridge`, for games started by `startStandaloneGame`. */
export class BridgedScene<C extends GameContract = GameContract> extends Scene {
  get bridge(): GameBridge<C> {
    const bridge = this.registry.get(BRIDGE_REGISTRY_KEY) as GameBridge<C> | undefined;
    if (!bridge) {
      throw new Error(`${this.scene.key}: BridgedScene needs startStandaloneGame()`);
    }
    return bridge;
  }
}
