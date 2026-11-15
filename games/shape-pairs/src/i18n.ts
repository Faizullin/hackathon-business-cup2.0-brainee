export type GameLocale = (typeof LANGUAGES)[number]["code"];
export const LANGUAGES = [{ code: "en", label: "English" }] as const;

const en = {
  title: "Shape Pairs",
  subtitle: "A matching shape for every balloon.",
  start: "Start playing",
  newRound: "Start a new round",
  resume: "Continue playing",
  settings: "Make it your own",
  level: "Level",
  total: "Pairs to find: {count}",
  easy: "Different outlines help you spot each pair.",
  hard: "Look closely: some shapes have similar outlines.",
  language: "Language",
  sound: "Sounds",
  soundOn: "Turn sound off",
  soundOff: "Turn sound on",
  menu: "Menu",
  hint: "Show a hint",
  how: "How to play",
  instructions:
    "Tap a shape, then the balloon with the same shape. Or draw a line between them. A match gives the balloon its color!",
  gentle: "Take your time. You can always try again.",
  changed: "The selected level applies to a new round. Continue keeps your current round.",
};
type Copy = { [K in keyof typeof en]: string };
export const COPY: Record<GameLocale, Copy> = { en };

/** Brainee is English-only (D-34): every host, query, saved or browser locale resolves to English. */
export function normalizeLocale(_value: unknown): GameLocale {
  return "en";
}

export function resolveLocale(..._sources: unknown[]): GameLocale {
  return "en";
}
