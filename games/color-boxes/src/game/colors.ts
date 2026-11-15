export interface ItemDef {
  id: string;
  /** The picture's name, in English. The game doesn't speak or show it. */
  word: string;
  /** The colour it belongs to. */
  color: string;
}

export type Pattern =
  | "dots"
  | "stripes"
  | "zigzag"
  | "waves"
  | "plus"
  | "checks"
  | "lattice"
  | "planks";

export interface ColorDef {
  id: string;
  /** The word under the box, for the adult sitting with the child. */
  word: string;
  /** The box's paint, its darker rim, and the shade its pattern is drawn in. */
  fill: number;
  rim: number;
  ink: number;
  /** A pattern no other box has, so the boxes differ even in greyscale. */
  pattern: Pattern;
  /** First in the list are the clearest; any of them can be a round's example. */
  items: readonly ItemDef[];
}

const items = (color: string, list: [id: string, word: string][]): ItemDef[] =>
  list.map(([id, word]) => ({ id, word, color }));

/**
 * The eight colours. The pictures in each have passed
 * `assets-src/check_colors.mjs` (they read as their colour and nothing close
 * to it) and a look by eye; see CREDITS.md for those left out.
 */
export const COLORS: readonly ColorDef[] = [
  {
    id: "red",
    word: "red",
    // The crimson the red pictures are drawn in, so the box and its pictures agree,
    // and well darker than the pink box.
    fill: 0xe02957,
    rim: 0xa8123a,
    ink: 0xffd1dc,
    pattern: "dots",
    items: items("red", [
      ["apple", "apple"],
      ["strawberry", "strawberry"],
      ["tomato", "tomato"],
      ["cherries", "cherries"],
      ["pepper", "pepper"],
      ["ladybug", "ladybug"],
    ]),
  },
  {
    id: "yellow",
    word: "yellow",
    fill: 0xfdd835,
    // A darker yellow, not orange: a box's edge mustn't suggest another colour.
    rim: 0xd4b106,
    ink: 0xc9a800,
    pattern: "stripes",
    items: items("yellow", [
      ["banana", "banana"],
      ["lemon", "lemon"],
      ["star", "star"],
      ["cheese", "cheese"],
      ["chick", "chick"],
      ["sun", "sun"],
      ["corn", "corn"],
      ["taxi", "taxi"],
    ]),
  },
  {
    id: "green",
    word: "green",
    fill: 0x43a047,
    rim: 0x1b5e20,
    ink: 0xc8e6c9,
    pattern: "zigzag",
    items: items("green", [
      ["green_apple", "apple"],
      ["clover", "clover"],
      ["lettuce", "lettuce"],
      ["cactus", "cactus"],
      ["cucumber", "cucumber"],
      ["lizard", "lizard"],
      ["green_heart", "heart"],
    ]),
  },
  {
    id: "blue",
    word: "blue",
    fill: 0x1e88e5,
    rim: 0x0d47a1,
    ink: 0xbbdefb,
    pattern: "waves",
    items: items("blue", [
      ["whale", "whale"],
      ["dolphin", "dolphin"],
      ["fish", "fish"],
      ["droplet", "drop"],
      ["jeans", "jeans"],
      ["blue_book", "book"],
      ["blue_heart", "heart"],
    ]),
  },
  {
    id: "purple",
    word: "purple",
    fill: 0x8e24aa,
    rim: 0x4a148c,
    ink: 0xe1bee7,
    pattern: "plus",
    items: items("purple", [
      ["grapes", "grapes"],
      ["eggplant", "eggplant"],
      ["umbrella", "umbrella"],
      ["gloves", "gloves"],
      ["purple_heart", "heart"],
    ]),
  },
  {
    id: "orange",
    word: "orange",
    fill: 0xfb8c00,
    rim: 0xe65100,
    ink: 0xffe0b2,
    pattern: "checks",
    items: items("orange", [
      ["carrot", "carrot"],
      ["tangerine", "tangerine"],
      ["fox", "fox"],
      ["basketball", "basketball"],
      ["orangutan", "orangutan"],
    ]),
  },
  {
    id: "pink",
    word: "pink",
    // The light pink of the pig and the flamingo, clearly lighter than the red box.
    fill: 0xff8fb3,
    rim: 0xd94f84,
    ink: 0xffffff,
    pattern: "lattice",
    items: items("pink", [
      ["pig", "pig"],
      ["flamingo", "flamingo"],
      ["blossom", "blossom"],
      ["hibiscus", "flower"],
      ["pink_heart", "heart"],
    ]),
  },
  {
    id: "brown",
    word: "brown",
    fill: 0x8d6e63,
    rim: 0x4e342e,
    ink: 0xd7ccc8,
    pattern: "planks",
    items: items("brown", [
      ["bear", "bear"],
      ["horse", "horse"],
      ["monkey", "monkey"],
      ["chestnut", "chestnut"],
      ["beaver", "beaver"],
    ]),
  },
];

/** The four colours easy levels use. */
export const EASY_COLORS: readonly string[] = ["red", "yellow", "green", "blue"];

/**
 * Colours too alike to share a round on easy levels. Red–green is here
 * because it is the pair most children with a colour-vision difference mix up.
 */
export const CLOSE_PAIRS: readonly (readonly [string, string])[] = [
  ["red", "pink"],
  ["red", "orange"],
  ["orange", "yellow"],
  ["orange", "brown"],
  ["blue", "purple"],
  ["pink", "purple"],
  ["red", "green"],
];

export function areClose(a: string, b: string): boolean {
  return CLOSE_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

export function colorById(id: string): ColorDef {
  const color = COLORS.find((candidate) => candidate.id === id);
  if (!color) throw new Error(`No colour ${id}`);
  return color;
}

export const itemUrl = (item: ItemDef) => `assets/items/${item.color}/${item.id}.png`;
export const itemKey = (item: ItemDef) => `item:${item.color}:${item.id}`;
export const BACKGROUND_URL = "assets/scenes/playroom.png";
export const BACKGROUND_KEY = "scene:playroom";
export const SCENE_WIDTH = 1024;
export const SCENE_HEIGHT = 768;
