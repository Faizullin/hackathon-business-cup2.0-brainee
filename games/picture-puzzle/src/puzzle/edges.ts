import type { Random } from "./random.ts";

/** Edge codes of rex `cutjigsawimage`: flat, a tab sticking out, a blank cut in. */
export const FLAT = 0;
export const TAB = 1;
export const BLANK = 2;
export type EdgeKind = typeof FLAT | typeof TAB | typeof BLANK;

export interface PieceEdges {
  left: EdgeKind;
  right: EdgeKind;
  top: EdgeKind;
  bottom: EdgeKind;
}

/** `layout[column][row]`, the shape the cutter's `edges` option takes. */
export type EdgeLayout = PieceEdges[][];

const opposite = (kind: EdgeKind): EdgeKind => (kind === TAB ? BLANK : kind === BLANK ? TAB : FLAT);

/**
 * Which side of every piece has a tab or a blank. Outer sides are flat, and
 * each inner side is the opposite of its neighbour's, so pieces interlock.
 * Generated once and shared by the cutter and the board outlines.
 */
export function generateEdges(columns: number, rows: number, random: Random): EdgeLayout {
  const layout: EdgeLayout = Array.from({ length: columns }, () => new Array<PieceEdges>(rows));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      layout[c][r] = {
        left: c === 0 ? FLAT : opposite(layout[c - 1][r].right),
        top: r === 0 ? FLAT : opposite(layout[c][r - 1].bottom),
        right: c === columns - 1 ? FLAT : random() < 0.5 ? TAB : BLANK,
        bottom: r === rows - 1 ? FLAT : random() < 0.5 ? TAB : BLANK,
      };
    }
  }
  return layout;
}

/** Tab size in source pixels, as the cutter computes it by default. */
export function edgeSize(
  pictureWidth: number,
  pictureHeight: number,
  columns: number,
  rows: number,
) {
  return {
    edgeWidth: Math.floor(pictureWidth / columns / 7),
    edgeHeight: Math.floor(pictureHeight / rows / 7),
  };
}
