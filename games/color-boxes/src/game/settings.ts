import { levelFor, type SortLevel } from "./levels.ts";

export type SortSettings = { boxes: number; perBox: number };
export const DEFAULT_SETTINGS: SortSettings = { boxes: 2, perBox: 2 };
export const PREFERENCES_KEY = "color-boxes.preferences.v1";

export function parseSettings(
  value: unknown,
  fallback: SortSettings = DEFAULT_SETTINGS,
): SortSettings {
  const data = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const count = (key: keyof SortSettings) =>
    typeof data[key] === "number" && Number.isInteger(data[key]) && data[key] >= 2 && data[key] <= 4
      ? data[key]
      : fallback[key];
  return { boxes: count("boxes"), perBox: count("perBox") };
}

/** Old level saves still supply the initial menu settings. Explicit choices stay fixed. */
export function settingsFromProgress(value: unknown): SortSettings {
  const saved = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const level = levelFor(typeof saved.level === "number" ? saved.level : 1);
  return parseSettings(saved.settings, { boxes: level.boxes, perBox: level.perBox });
}

export function configuredLevel(settings: SortSettings): SortLevel {
  const { boxes, perBox } = parseSettings(settings);
  // Keep the legacy level field meaningful for existing event consumers.
  const level = perBox === 4 ? 5 : boxes === 4 ? 4 : perBox === 3 ? 3 : boxes === 3 ? 2 : 1;
  return { level, boxes, perBox, example: perBox === 2, hard: boxes === 4 || perBox === 4 };
}
