import { BRIDGE_REGISTRY_KEY } from "@brainee/engine-phaser/bridge";
import { startStandaloneGame } from "@brainee/engine-phaser/standalone";
import type { GameBridge } from "@brainee/game-bridge";
import { STICKER_SCENE_CONTRACT, type StickerSceneContract } from "./contract";
import { StickerScene } from "./scenes/StickerScene";
import "./ui/menu.css";

const game = startStandaloneGame<StickerSceneContract>(
  "sticker-scene",
  {
    // The canvas follows the window: the store plays games full-window.
    scaleMode: "resize",
    backgroundColor: "#f3ede2",
    scenes: [StickerScene],
  },
  { contract: STICKER_SCENE_CONTRACT },
);
// Explore hosts wait for "ready"; the scene draws its menu as soon as the game boots.
game.events.once("ready", () =>
  (game.registry.get(BRIDGE_REGISTRY_KEY) as GameBridge).lifecycle("ready"),
);
