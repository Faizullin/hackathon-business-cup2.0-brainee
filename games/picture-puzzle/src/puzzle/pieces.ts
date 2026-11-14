import type { PuzzleLevel } from "./levels.ts";
import { type Random, shuffled } from "./random.ts";

/** Pieces are numbered row by row: `row * columns + column`, the cutter's order. */
export const pieceIndex = (column: number, row: number, columns: number) => row * columns + column;

export const pieceCell = (index: number, columns: number) => ({
  column: index % columns,
  row: Math.floor(index / columns),
});

export interface PieceSplit {
  /** Pieces the child places, in tray order. */
  inTray: number[];
  /** Pieces already on the board ("finish the picture"). */
  onBoard: number[];
}

/** Which pieces start in the tray: a few random ones, or all of them shuffled. */
export function splitPieces(level: PuzzleLevel, random: Random): PieceSplit {
  const all = Array.from({ length: level.rows * level.columns }, (_, index) => index);
  const order = shuffled(all, random);
  const count = Math.min(level.inTray, all.length);
  const inTray = order.slice(0, count);
  const taken = new Set(inTray);
  return { inTray, onBoard: all.filter((index) => !taken.has(index)) };
}

/** Tray pages for `pieces` tray pieces, `perPage` at a time (at least one page). */
export const trayPageCount = (pieces: number, perPage: number) =>
  Math.max(1, Math.ceil(pieces / perPage));

/** Keeps the tray on a page that still has pieces after one is placed. */
export const clampTrayPage = (page: number, pieces: number, perPage: number) =>
  Math.min(Math.max(page, 0), trayPageCount(pieces, perPage) - 1);
