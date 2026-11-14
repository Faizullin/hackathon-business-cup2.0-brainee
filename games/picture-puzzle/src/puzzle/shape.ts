import { BLANK, type PieceEdges, TAB } from "./edges.ts";

/** The path calls shared by a canvas 2D context and a Phaser `Graphics`. */
export interface PathPen {
  beginPath(): unknown;
  moveTo(x: number, y: number): unknown;
  lineTo(x: number, y: number): unknown;
  arc(
    x: number,
    y: number,
    radius: number,
    start: number,
    end: number,
    anticlockwise?: boolean,
  ): unknown;
  closePath(): unknown;
}

const D90 = Math.PI / 2;
const D180 = Math.PI;
const D270 = (3 * Math.PI) / 2;
const D360 = 2 * Math.PI;

/**
 * Traces one piece inside its frame: the cell inset by the tab size, with a
 * semicircle tab or blank in the middle of each inner side. The cutter clips
 * pieces with it and the board draws its outlines with it, so both match.
 * The ±1 px radius overlap is the cutter's default shape, kept so seams close.
 */
export function tracePiece(
  pen: PathPen,
  width: number,
  height: number,
  edgeWidth: number,
  edgeHeight: number,
  edges: PieceEdges,
  originX = 0,
  originY = 0,
): void {
  const left = originX + edgeWidth;
  const right = originX + width - edgeWidth;
  const top = originY + edgeHeight;
  const bottom = originY + height - edgeHeight;
  const centerX = originX + width / 2;
  const centerY = originY + height / 2;
  const vertical = edgeHeight > 0;
  const horizontal = edgeWidth > 0;

  pen.beginPath();
  pen.moveTo(left, top);

  if (vertical && edges.top === TAB) {
    pen.lineTo(centerX - edgeHeight - 1, top);
    pen.arc(centerX, top, edgeHeight + 1, D180, D360, false);
  } else if (vertical && edges.top === BLANK) {
    pen.lineTo(centerX - edgeHeight + 1, top);
    pen.arc(centerX, top, edgeHeight - 1, D180, D360, true);
  }
  pen.lineTo(right, top);

  if (horizontal && edges.right === TAB) {
    pen.arc(right, centerY, edgeWidth + 1, D270, D90, false);
  } else if (horizontal && edges.right === BLANK) {
    pen.arc(right, centerY, edgeWidth - 1, D270, D90, true);
  }
  pen.lineTo(right, bottom);

  if (vertical && edges.bottom === TAB) {
    pen.arc(centerX, bottom, edgeHeight + 1, 0, D180, false);
  } else if (vertical && edges.bottom === BLANK) {
    pen.arc(centerX, bottom, edgeHeight - 1, 0, D180, true);
  }
  pen.lineTo(left, bottom);

  if (horizontal && edges.left === TAB) {
    pen.arc(left, centerY, edgeWidth + 1, D90, D270, false);
  } else if (horizontal && edges.left === BLANK) {
    pen.arc(left, centerY, edgeWidth - 1, D90, D270, true);
  }
  pen.lineTo(left, top);
  pen.closePath();
}
