import { type Random, shuffled } from "@brainee/engine-phaser/random";
import type { StickerLevel } from "./levels.ts";
import type { StickerDef } from "./scenes.ts";

/**
 * The stickers a round asks for, in tray order. Easy levels take at most one
 * sticker per outline group; when a scene has fewer groups than the level
 * needs, the rest fill in.
 */
export function pickRound(
  stickers: readonly StickerDef[],
  level: StickerLevel,
  random: Random,
): StickerDef[] {
  const order = shuffled(stickers, random);
  const count = Math.min(level.count, order.length);
  if (level.mixGroups) return order.slice(0, count);

  const picked: StickerDef[] = [];
  const groups = new Set<string>();
  for (const sticker of order) {
    if (picked.length === count) break;
    if (groups.has(sticker.group)) continue;
    groups.add(sticker.group);
    picked.push(sticker);
  }
  for (const sticker of order) {
    if (picked.length === count) break;
    if (!picked.includes(sticker)) picked.push(sticker);
  }
  return picked;
}

/** Pages a tray of `count` stickers needs. */
export function trayPageCount(count: number, perPage: number): number {
  return Math.max(Math.ceil(count / perPage), 1);
}

/** A page that still exists after the tray shrank. */
export function clampTrayPage(page: number, count: number, perPage: number): number {
  return Math.min(Math.max(page, 0), trayPageCount(count, perPage) - 1);
}
