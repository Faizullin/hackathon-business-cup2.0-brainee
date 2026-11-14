export interface StickerDef {
  id: string;
  /** The sticker's name, in English. The game doesn't speak or show it. */
  word: string;
  /**
   * Stickers with alike outlines share a group. Easy levels take one sticker
   * per group, so the silhouettes in a round are easy to tell apart.
   */
  group: string;
  /** The sticker's centre in the scene, as shares of its width and height. */
  x: number;
  y: number;
  /** The sticker's longest side, as a share of the scene's width. */
  size: number;
}

export interface SceneDef {
  id: string;
  stickers: readonly StickerDef[];
}

export const SCENE_WIDTH = 1024;
export const SCENE_HEIGHT = 768;
/**
 * The size, as a share of the scene's width, that snap distances and taps are
 * measured with for small stickers: a chick is as easy to place as a cow.
 */
export const REACH_SIZE = 0.2;

/**
 * The three settings. Every sticker has one place in its scene, scattered the
 * way things sit in a picture (the crab on the sand, the apple in the tree),
 * with sizes that fit what they are. A unit test keeps them inside the scene
 * and off each other. Art: see CREDITS.md.
 */
export const SCENES: readonly SceneDef[] = [
  {
    id: "sea",
    stickers: [
      { id: "dolphin", word: "dolphin", group: "swimmer", x: 0.13, y: 0.17, size: 0.2 },
      { id: "whale", word: "whale", group: "swimmer", x: 0.42, y: 0.22, size: 0.26 },
      { id: "jellyfish", word: "jellyfish", group: "tentacles", x: 0.68, y: 0.14, size: 0.17 },
      { id: "shark", word: "shark", group: "swimmer", x: 0.86, y: 0.38, size: 0.24 },
      { id: "fish", word: "fish", group: "swimmer", x: 0.27, y: 0.47, size: 0.14 },
      { id: "octopus", word: "octopus", group: "tentacles", x: 0.52, y: 0.52, size: 0.19 },
      { id: "pufferfish", word: "puffer fish", group: "round", x: 0.1, y: 0.52, size: 0.15 },
      { id: "turtle", word: "turtle", group: "turtle", x: 0.71, y: 0.63, size: 0.18 },
      { id: "coral", word: "coral", group: "coral", x: 0.12, y: 0.84, size: 0.2 },
      { id: "crab", word: "crab", group: "claws", x: 0.33, y: 0.87, size: 0.15 },
      { id: "shell", word: "shell", group: "shell", x: 0.54, y: 0.86, size: 0.14 },
      { id: "lobster", word: "lobster", group: "claws", x: 0.88, y: 0.84, size: 0.19 },
    ],
  },
  {
    id: "jungle",
    stickers: [
      { id: "parrot", word: "parrot", group: "parrot", x: 0.11, y: 0.15, size: 0.17 },
      { id: "monkey", word: "monkey", group: "monkey", x: 0.33, y: 0.24, size: 0.2 },
      { id: "butterfly", word: "butterfly", group: "butterfly", x: 0.55, y: 0.12, size: 0.14 },
      { id: "banana", word: "banana", group: "banana", x: 0.76, y: 0.19, size: 0.15 },
      { id: "snake", word: "snake", group: "snake", x: 0.12, y: 0.47, size: 0.18 },
      { id: "gorilla", word: "gorilla", group: "four-legs", x: 0.55, y: 0.47, size: 0.23 },
      { id: "pineapple", word: "pineapple", group: "pineapple", x: 0.32, y: 0.53, size: 0.14 },
      { id: "palm", word: "palm tree", group: "palm", x: 0.87, y: 0.52, size: 0.25 },
      { id: "tiger", word: "tiger", group: "four-legs", x: 0.15, y: 0.82, size: 0.21 },
      { id: "elephant", word: "elephant", group: "four-legs", x: 0.44, y: 0.81, size: 0.26 },
      { id: "frog", word: "frog", group: "frog", x: 0.67, y: 0.88, size: 0.13 },
      { id: "crocodile", word: "crocodile", group: "crocodile", x: 0.88, y: 0.85, size: 0.19 },
    ],
  },
  {
    id: "farm",
    stickers: [
      { id: "apple", word: "apple", group: "apple", x: 0.13, y: 0.2, size: 0.13 },
      { id: "rooster", word: "rooster", group: "bird", x: 0.36, y: 0.22, size: 0.16 },
      { id: "tractor", word: "tractor", group: "tractor", x: 0.7, y: 0.19, size: 0.25 },
      { id: "sunflower", word: "sunflower", group: "sunflower", x: 0.915, y: 0.5, size: 0.16 },
      { id: "cow", word: "cow", group: "four-legs", x: 0.36, y: 0.5, size: 0.23 },
      { id: "horse", word: "horse", group: "four-legs", x: 0.63, y: 0.58, size: 0.23 },
      { id: "sheep", word: "sheep", group: "four-legs", x: 0.13, y: 0.56, size: 0.19 },
      { id: "pig", word: "pig", group: "four-legs", x: 0.5, y: 0.85, size: 0.18 },
      { id: "duck", word: "duck", group: "bird", x: 0.13, y: 0.86, size: 0.17 },
      { id: "chick", word: "chick", group: "bird", x: 0.31, y: 0.78, size: 0.13 },
      { id: "rabbit", word: "rabbit", group: "rabbit", x: 0.7, y: 0.84, size: 0.16 },
      { id: "carrot", word: "carrot", group: "carrot", x: 0.88, y: 0.86, size: 0.14 },
    ],
  },
];

export const backgroundUrl = (scene: SceneDef) => `assets/scenes/${scene.id}.png`;
export const backgroundKey = (scene: SceneDef) => `scene:${scene.id}`;
export const stickerUrl = (scene: SceneDef, sticker: StickerDef) =>
  `assets/stickers/${scene.id}/${sticker.id}.png`;
export const stickerKey = (scene: SceneDef, sticker: StickerDef) =>
  `sticker:${scene.id}:${sticker.id}`;
