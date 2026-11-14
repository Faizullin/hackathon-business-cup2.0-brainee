export interface Point {
  x: number;
  y: number;
}

/** A drop this close to its cell (share of the piece's smaller side) snaps in. */
export const SNAP_TOLERANCE = 0.35;
/** From this close, a dragged piece is pulled toward its cell. */
export const PULL_RANGE = 0.6;
/** After this many wrong drops of one piece, its cell glows once. */
export const HINT_AFTER_WRONG_DROPS = 2;

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** "snap" into the cell, "return" to the tray: forgiving, never a fail screen. */
export function dropResult(drop: Point, target: Point, pieceWidth: number, pieceHeight: number) {
  return distance(drop, target) <= SNAP_TOLERANCE * Math.min(pieceWidth, pieceHeight)
    ? "snap"
    : "return";
}

/**
 * Where a dragged piece is drawn: the pointer, eased toward its cell once it
 * is within the pull range, fully there at the snap distance.
 */
export function pulledPosition(
  pointer: Point,
  target: Point,
  pieceWidth: number,
  pieceHeight: number,
): Point {
  const size = Math.min(pieceWidth, pieceHeight);
  const snap = SNAP_TOLERANCE * size;
  const pull = PULL_RANGE * size;
  const gap = distance(pointer, target);
  if (gap >= pull) return pointer;
  const strength = gap <= snap ? 1 : 1 - (gap - snap) / (pull - snap);
  const eased = strength * 0.5;
  return {
    x: pointer.x + (target.x - pointer.x) * eased,
    y: pointer.y + (target.y - pointer.y) * eased,
  };
}

export function shouldGlowHint(wrongDrops: number): boolean {
  return wrongDrops === HINT_AFTER_WRONG_DROPS;
}
