export const LANGUAGES = [{ code: "en", label: "English" }] as const;
export type GameLocale = (typeof LANGUAGES)[number]["code"];

const en = {
  title: "Color Boxes",
  subtitle: "A little sorting. A lot of discovery.",
  start: "Start playing",
  newRound: "Start a new round",
  resume: "Continue playing",
  settings: "Make it your own",
  baskets: "Number of baskets",
  pictures: "Pictures per basket",
  total: "Pictures to sort: {count}",
  examples: "A picture in each basket shows you where to start.",
  noExamples: "Match each picture to a basket of the same color.",
  language: "Language",
  sound: "Sounds",
  soundOn: "Turn sound off",
  soundOff: "Turn sound on",
  menu: "Menu",
  hint: "Show a hint",
  how: "How to play",
  instructions:
    "Drag a picture into a basket of the same color. Or tap the picture, then the basket.",
  gentle: "Take your time. You can always try again.",
  changed: "New settings apply when you start a new round.",
  colors: {
    red: "red",
    yellow: "yellow",
    green: "green",
    blue: "blue",
    purple: "purple",
    orange: "orange",
    pink: "pink",
    brown: "brown",
  },
};
type Copy = {
  [K in keyof typeof en]: K extends "colors" ? Record<keyof typeof en.colors, string> : string;
};

export const COPY: Record<GameLocale, Copy> = { en };

/** Brainee is English-only (D-34): every host, query, saved or browser locale resolves to English. */
export function normalizeLocale(_value: unknown): GameLocale {
  return "en";
}

export function resolveLocale(..._sources: unknown[]): GameLocale {
  return "en";
}
