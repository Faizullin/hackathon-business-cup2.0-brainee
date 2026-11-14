import type { Rect } from "@brainee/engine-phaser/layout";
import type { Point } from "@brainee/engine-phaser/snap";
import { REACH_SIZE, type StickerDef } from "./scenes.ts";

type Placed = Pick<StickerDef, "x" | "y" | "size">;

/** A sticker's longest side on screen, for a scene drawn in `board`. */
export function stickerSide(board: Rect, sticker: Pick<StickerDef, "size">): number {
  return board.width * sticker.size;
}

/**
 * The size a sticker's snap distance and tap area are measured with: its own,
 * but never less than the reach size, so small stickers aren't fiddly.
 */
export function reachSide(board: Rect, sticker: Pick<StickerDef, "size">): number {
  return board.width * Math.max(sticker.size, REACH_SIZE);
}

/** Where a sticker's centre belongs on screen. */
export function stickerCenter(board: Rect, sticker: Pick<StickerDef, "x" | "y">): Point {
  return { x: board.x + sticker.x * board.width, y: board.y + sticker.y * board.height };
}

/**
 * The sticker whose place `point` is on, or `null` on open scenery. A place
 * reaches half its reach side from its centre; where two reach the point, the
 * one the point is deeper inside wins.
 */
export function stickerAt<S extends Placed>(
  point: Point,
  board: Rect,
  stickers: readonly S[],
): S | null {
  let nearest: S | null = null;
  let nearestDepth = 1;
  for (const sticker of stickers) {
    const center = stickerCenter(board, sticker);
    const depth =
      Math.hypot(point.x - center.x, point.y - center.y) / (reachSide(board, sticker) / 2);
    if (depth <= nearestDepth) {
      nearest = sticker;
      nearestDepth = depth;
    }
  }
  return nearest;
}
