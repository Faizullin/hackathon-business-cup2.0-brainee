import { type Random, shuffled } from "@brainee/engine-phaser/random";
import { areClose, COLORS, type ColorDef, EASY_COLORS, type ItemDef } from "./colors.ts";
import type { SortLevel } from "./levels.ts";

export interface SortRound {
  /** The boxes, left to right. */
  colors: ColorDef[];
  /** The pictures to sort, in tray order. */
  items: ItemDef[];
  /** The picture already in each box (levels with an example), by colour. */
  examples: Map<string, ItemDef>;
}

/**
 * A round's boxes and pictures. Easy levels take colours from the easy four
 * and never two close ones; hard levels take any of the eight. Each box gets
 * `perBox` pictures of its colour (plus an example on early levels), and the
 * tray mixes them all.
 */
export function pickRound(level: SortLevel, random: Random): SortRound {
  const pool = level.hard ? COLORS : COLORS.filter((color) => EASY_COLORS.includes(color.id));
  const colors: ColorDef[] = [];
  for (const color of shuffled(pool, random)) {
    if (colors.length === level.boxes) break;
    if (!level.hard && colors.some((picked) => areClose(picked.id, color.id))) continue;
    colors.push(color);
  }
  if (colors.length < level.boxes)
    throw new Error(`Level ${level.level}: not enough colours apart`);

  const examples = new Map<string, ItemDef>();
  const items: ItemDef[] = [];
  for (const color of colors) {
    const [first, ...rest] = shuffled(color.items, random);
    if (level.example) examples.set(color.id, first);
    items.push(...(level.example ? rest : [first, ...rest]).slice(0, level.perBox));
  }
  return { colors, items: shuffled(items, random), examples };
}

/** Pages a tray of `count` pictures needs. */
export function trayPageCount(count: number, perPage: number): number {
  return Math.max(Math.ceil(count / perPage), 1);
}

/** A page that still exists after the tray shrank. */
export function clampTrayPage(page: number, count: number, perPage: number): number {
  return Math.min(Math.max(page, 0), trayPageCount(count, perPage) - 1);
}
