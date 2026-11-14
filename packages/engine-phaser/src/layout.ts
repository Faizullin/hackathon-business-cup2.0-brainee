export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PuzzleLayout {
  orientation: "landscape" | "portrait";
  /** The picture's place on screen. */
  board: Rect;
  /** Screen pixels per picture pixel on the board. */
  scale: number;
  cellWidth: number;
  cellHeight: number;
  tray: Rect;
  /** Square slots for the tray pieces shown at once. */
  slots: Rect[];
  /** Centres of the tray's page arrows, inside the tray; null without paging. */
  arrows: { previous: { x: number; y: number }; next: { x: number; y: number } } | null;
}

export interface LayoutInput {
  width: number;
  height: number;
  pictureWidth: number;
  pictureHeight: number;
  columns: number;
  rows: number;
  /** Tray pieces visible at once (0 hides the tray). */
  visibleSlots: number;
  /** More tray pieces than slots: keep room for the page arrows. */
  paged?: boolean;
}

export const MARGIN = 16;
export const GAP = 16;
/**
 * The top strip stays free: the store's back button floats top-left (32 px at
 * an 8 px inset) and the game's round buttons sit top-right.
 */
export const TOP_BAR = 72;
/** Tray pieces visible at once; more pages with arrows. */
export const MAX_VISIBLE_SLOTS = 6;
/** Room for a page arrow at each end of a paged tray. */
export const ARROW_BAND = 48;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Board and tray for any window shape: the tray sits beside the board in
 * landscape and under it in portrait, and the board takes the rest at the
 * picture's aspect ratio.
 */
export function computeLayout(input: LayoutInput): PuzzleLayout {
  const { width, height, pictureWidth, pictureHeight, columns, rows } = input;
  const visible = Math.min(Math.max(input.visibleSlots, 0), MAX_VISIBLE_SLOTS);
  const orientation = width >= height ? "landscape" : "portrait";

  let area: Rect;
  let tray: Rect;
  if (orientation === "landscape") {
    const trayWidth = visible > 0 ? clamp(width * 0.24, 120, 320) : 0;
    tray = {
      x: width - MARGIN - trayWidth,
      y: TOP_BAR,
      width: trayWidth,
      height: height - TOP_BAR - MARGIN,
    };
    area = {
      x: MARGIN,
      y: TOP_BAR,
      width: tray.x - (visible > 0 ? GAP : 0) - MARGIN,
      height: tray.height,
    };
  } else {
    const trayHeight = visible > 0 ? clamp(height * 0.24, 110, 280) : 0;
    tray = {
      x: MARGIN,
      y: height - MARGIN - trayHeight,
      width: width - 2 * MARGIN,
      height: trayHeight,
    };
    area = {
      x: MARGIN,
      y: TOP_BAR,
      width: width - 2 * MARGIN,
      height: tray.y - (visible > 0 ? GAP : 0) - TOP_BAR,
    };
  }

  const scale = Math.max(Math.min(area.width / pictureWidth, area.height / pictureHeight), 0);
  const boardWidth = pictureWidth * scale;
  const boardHeight = pictureHeight * scale;
  const board = {
    x: area.x + (area.width - boardWidth) / 2,
    y: area.y + (area.height - boardHeight) / 2,
    width: boardWidth,
    height: boardHeight,
  };

  // Page arrows sit at both ends of the tray's long side, outside the slots.
  const paged = Boolean(input.paged) && visible > 0;
  let slotArea = tray;
  let arrows: PuzzleLayout["arrows"] = null;
  if (paged && orientation === "landscape") {
    slotArea = { ...tray, y: tray.y + ARROW_BAND, height: tray.height - 2 * ARROW_BAND };
    const x = tray.x + tray.width / 2;
    arrows = {
      previous: { x, y: tray.y + ARROW_BAND / 2 },
      next: { x, y: tray.y + tray.height - ARROW_BAND / 2 },
    };
  } else if (paged) {
    slotArea = { ...tray, x: tray.x + ARROW_BAND, width: tray.width - 2 * ARROW_BAND };
    const y = tray.y + tray.height / 2;
    arrows = {
      previous: { x: tray.x + ARROW_BAND / 2, y },
      next: { x: tray.x + tray.width - ARROW_BAND / 2, y },
    };
  }

  return {
    orientation,
    board,
    scale,
    cellWidth: boardWidth / columns,
    cellHeight: boardHeight / rows,
    tray,
    slots: traySlots(slotArea, visible, orientation),
    arrows,
  };
}

function traySlots(tray: Rect, count: number, orientation: PuzzleLayout["orientation"]): Rect[] {
  if (count === 0) return [];
  // Landscape stacks one or two columns; portrait lays one or two rows.
  const lines = count <= 3 ? 1 : 2;
  const across = Math.ceil(count / lines);
  const columns = orientation === "landscape" ? lines : across;
  const rows = orientation === "landscape" ? across : lines;
  const size = Math.min(tray.width / columns, tray.height / rows) * 0.9;
  const offsetX = tray.x + (tray.width - columns * size) / 2;
  const offsetY = tray.y + (tray.height - rows * size) / 2;
  return Array.from({ length: count }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return { x: offsetX + column * size, y: offsetY + row * size, width: size, height: size };
  });
}

/** The centre of a board cell, where its piece's centre lands. */
export function cellCenter(layout: PuzzleLayout, column: number, row: number) {
  return {
    x: layout.board.x + (column + 0.5) * layout.cellWidth,
    y: layout.board.y + (row + 0.5) * layout.cellHeight,
  };
}
