import { levelFor, type StickerLevel } from "./levels.ts";

export const MIN_MISSING = 3;
export const MAX_MISSING = 6;
export const PREFERENCES_KEY = "sticker-scene.preferences.v1";

export function parseMissing(value: unknown, fallback = MIN_MISSING): number {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_MISSING &&
    value <= MAX_MISSING
    ? value
    : fallback;
}

/** Old saves initialize the slider within its new range; all levels honour the choice. */
export function missingFromProgress(saved: unknown): number {
  const data =
    saved && typeof saved === "object" && !Array.isArray(saved)
      ? (saved as Record<string, unknown>)
      : {};
  const level = typeof data.level === "number" ? data.level : 1;
  return parseMissing(data.missing, Math.min(levelFor(level, 900).count, MAX_MISSING));
}

export function configuredLevel(level: number, missing: number): StickerLevel {
  return { ...levelFor(level, 900), count: parseMissing(missing) };
}
