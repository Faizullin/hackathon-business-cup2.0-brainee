import type { Point } from "./shapes.ts";
export interface Rect extends Point {
  width: number;
  height: number;
}
export const contains = (r: Rect, p: Point) =>
  p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;
export const center = (r: Rect): Point => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 });

/** The top strip stays free for the store's back button and the game's own buttons. */
const TOP_BAR = 88;
const MARGIN = 16;
/** Room between the balloons and the shapes: the strings cross it, and Next sits in it. */
const MIDDLE = 96;
/** The least room between two targets. */
const GAP = 12;
/** Targets never grow past this, so three shapes on a desktop don't become posters. */
const MAX_SIZE = 200;

/**
 * The balloons' group on top (the sky) and the shapes' group under it (the
 * grass), in any window. Each group is one row when its targets can be big
 * that way, otherwise two or more; the arrangement with the biggest targets
 * wins, and fewer rows break a tie.
 */
export function computeLayout(width: number, height: number, count: number) {
  const landscape = width >= height;
  const board: Rect = {
    x: MARGIN,
    y: TOP_BAR,
    width: width - 2 * MARGIN,
    height: height - TOP_BAR - MARGIN,
  };
  const groupHeight = (board.height - MIDDLE) / 2;
  const a: Rect = { x: board.x, y: board.y, width: board.width, height: groupHeight };
  const b: Rect = { ...a, y: board.y + groupHeight + MIDDLE };

  const candidate = (cols: number) => {
    const rows = Math.ceil(count / cols);
    const size = Math.min(
      MAX_SIZE,
      (a.width - GAP * (cols - 1)) / cols,
      (a.height - GAP * (rows - 1)) / rows,
    );
    return { cols, rows, size };
  };
  const grid = Array.from({ length: count }, (_, i) => candidate(i + 1)).sort(
    (x, y) => y.size - x.size || x.rows - y.rows,
  )[0];

  const slots = (panel: Rect) =>
    Array.from({ length: count }, (_, i): Rect => {
      const row = Math.floor(i / grid.cols),
        col = i % grid.cols;
      const inRow = Math.min(grid.cols, count - row * grid.cols);
      // Spread a row out a little, so a few big targets don't huddle in the middle.
      const gapX = Math.min(
        Math.max((panel.width - inRow * grid.size) / (inRow + 1), GAP),
        grid.size * 0.45,
      );
      const rowWidth = inRow * grid.size + (inRow - 1) * gapX;
      return {
        x: panel.x + (panel.width - rowWidth) / 2 + col * (grid.size + gapX),
        y:
          panel.y +
          (panel.height - grid.rows * grid.size - (grid.rows - 1) * GAP) / 2 +
          row * (grid.size + GAP),
        width: grid.size,
        height: grid.size,
      };
    });
  // Side 0 is the coloured shapes (on the grass, below); side 1 the white balloons (in the sky, above).
  return {
    board,
    panels: [a, b],
    slots: [slots(b), slots(a)],
    landscape,
    sound: { x: width - 52, y: 44 },
    hint: { x: width - 136, y: 44 },
    next: center(board),
  };
}
