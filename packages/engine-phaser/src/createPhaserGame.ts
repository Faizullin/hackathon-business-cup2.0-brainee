import { AUTO, Game, Scale, type Types } from "phaser";

export interface PhaserCoreGameOptions {
  parent: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  /** Prefix for relative asset paths: "/" in the Next.js app, unset in a standalone build. */
  assetBaseUrl?: string;
  /**
   * `fit` (default) letterboxes a fixed-size canvas; `resize` makes the canvas
   * the size of its container, for games that lay themselves out per window.
   */
  scaleMode?: "fit" | "resize";
  scenes: Types.Scenes.SceneType[];
}

/**
 * Shared factory for creating a responsive Phaser.Game instance from any Phaser game package.
 */
export function createPhaserGame({
  parent,
  width = 1024,
  height = 768,
  backgroundColor = "#028af8",
  assetBaseUrl,
  scaleMode = "fit",
  scenes,
}: PhaserCoreGameOptions): Game {
  const config: Types.Core.GameConfig = {
    type: AUTO,
    width,
    height,
    parent,
    backgroundColor,
    scale:
      scaleMode === "resize"
        ? { mode: Scale.RESIZE, autoCenter: Scale.NO_CENTER }
        : { mode: Scale.FIT, autoCenter: Scale.CENTER_BOTH },
    scene: scenes,
    ...(assetBaseUrl ? { loader: { baseURL: assetBaseUrl } } : {}),
  };

  const game = new Game(config);
  // Lets tests and the gameplay recorder reach the running scenes.
  if (typeof window !== "undefined") window.__PHASER_GAME__ = game;
  return game;
}

declare global {
  interface Window {
    __PHASER_GAME__?: Game;
  }
}
