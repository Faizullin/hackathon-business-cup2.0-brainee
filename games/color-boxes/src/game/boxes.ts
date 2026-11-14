import type { Rect } from "@brainee/engine-phaser/layout";
import type { Point } from "@brainee/engine-phaser/snap";

export interface BoxPlace {
  /** The box itself: its open top edge (the rim) is `body.y`. */
  body: Rect;
  /** Where a drop or tap counts as this box: the box and the pile above it. */
  zone: Rect;
  /** Longest side of a picture sitting in the box. */
  itemSide: number;
  /** Centre of the colour word under the box. */
  label: Point;
}

/** Share of the scene's height where the boxes stand (their bottom edge). */
const FLOOR = 0.9;

/**
 * The boxes, in one row on the rug, for a scene drawn in `board`. Two or three
 * boxes are wider and further apart than four.
 */
export function boxPlaces(board: Rect, count: number): BoxPlace[] {
  const width = (count <= 3 ? 0.22 : 0.2) * board.width;
  const spacing = (count <= 3 ? 0.29 : 0.25) * board.width;
  const height = width * 0.62;
  const bottom = board.y + FLOOR * board.height;
  const itemSide = width * 0.5;
  const first = board.x + board.width / 2 - ((count - 1) * spacing) / 2;
  return Array.from({ length: count }, (_, index) => {
    const centerX = first + index * spacing;
    const body = { x: centerX - width / 2, y: bottom - height, width, height };
    // The zone reaches a little past the box's sides and over its pile.
    const pad = (spacing - width) * 0.4;
    const top = body.y - itemSide * 1.15;
    return {
      body,
      zone: { x: body.x - pad, y: top, width: width + 2 * pad, height: bottom - top },
      itemSide,
      label: { x: centerX, y: bottom + (board.y + board.height - bottom) / 2 },
    };
  });
}

/**
 * Where the `slot`-th picture in a box sits: two at the back, standing higher,
 * then two in front, lower and a little apart, with the box's front panel over
 * their lower part.
 */
export function slotCenter(box: BoxPlace, slot: number): Point {
  const { body, itemSide } = box;
  const back = slot < 2;
  const side = slot % 2 === 0 ? -1 : 1;
  const centerX = body.x + body.width / 2;
  return {
    x: centerX + side * body.width * (back ? 0.2 : 0.26),
    y: body.y - itemSide * (back ? 0.52 : 0.12),
  };
}

/** The box whose zone `point` is in, or `null` elsewhere. */
export function boxAt(point: Point, boxes: readonly BoxPlace[]): number | null {
  const index = boxes.findIndex(
    ({ zone }) =>
      point.x >= zone.x &&
      point.x <= zone.x + zone.width &&
      point.y >= zone.y &&
      point.y <= zone.y + zone.height,
  );
  return index === -1 ? null : index;
}
