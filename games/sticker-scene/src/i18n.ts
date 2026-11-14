export type GameLocale = (typeof LANGUAGES)[number]["code"];
export const LANGUAGES = [{ code: "en", label: "English" }] as const;

const en = {
  title: "Sticker Scene",
  subtitle: "Little stickers, three worlds to explore.",
  start: "Start playing",
  newRound: "Start a new scene",
  resume: "Continue playing",
  settings: "Make it your own",
  location: "Choose a place",
  missing: "Missing stickers",
  summary: "To place: {missing} · Already in the scene: {placed}",
  note: "Each place has 12 stickers. Your choice applies to every level.",
  language: "Language",
  sound: "Sounds",
  soundOn: "Turn sound off",
  soundOff: "Turn sound on",
  menu: "Menu",
  hint: "Show a hint",
  how: "How to play",
  instructions:
    "Drag each sticker onto its matching shadow. Or tap the sticker, then its shadow. Fill the picture and explore the next place!",
  gentle: "Take your time. You can always try again.",
  changed: "New settings apply to a new scene. Continue keeps your current picture.",
  scenes: { sea: "Underwater", jungle: "Jungle", farm: "Farm" },
};
type Copy = {
  [K in keyof typeof en]: K extends "scenes" ? Record<keyof typeof en.scenes, string> : string;
};
export const COPY: Record<GameLocale, Copy> = { en };

/** Brainee is English-only (D-34): every host, query, saved or browser locale resolves to English. */
export function normalizeLocale(_value: unknown): GameLocale {
  return "en";
}

export function resolveLocale(..._sources: unknown[]): GameLocale {
  return "en";
}
