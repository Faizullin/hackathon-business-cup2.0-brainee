import { BRIDGE_REGISTRY_KEY, phaserAdapter } from "@brainee/engine-phaser/bridge";
import { createPhaserGame } from "@brainee/engine-phaser/createPhaserGame";
import { contextFromUrl, GameBridge } from "@brainee/game-bridge";
import { SHAPE_PAIRS_CONTRACT, type ShapePairsContract } from "./contract";
import { ShapePairsScene } from "./scenes/ShapePairsScene";
import "./ui/menu.css";

const game = createPhaserGame({
  parent: "game-container",
  scaleMode: "resize",
  backgroundColor: "#f3ede2",
  scenes: [ShapePairsScene],
});
const bridge = GameBridge.connect<ShapePairsContract>({
  contract: SHAPE_PAIRS_CONTRACT,
  fallback: () => ({ context: { gameId: "shape-pairs", ...contextFromUrl() } }),
  adapter: phaserAdapter(game),
});
game.registry.set(BRIDGE_REGISTRY_KEY, bridge);
game.events.once("ready", () => bridge.lifecycle("ready"));
