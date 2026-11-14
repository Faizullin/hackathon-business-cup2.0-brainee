/** "finish": complete a picture with a few missing pieces; "jigsaw": every piece. */
export type PuzzleMode = "finish" | "jigsaw";

export interface PuzzleLevel {
  level: number;
  mode: PuzzleMode;
  rows: number;
  columns: number;
  /** Pieces the child places; the rest start on the board. */
  inTray: number;
  /** The whole picture at 20% under the outlines. */
  fadedPicture: boolean;
}

export const LEVELS: readonly PuzzleLevel[] = [
  { level: 1, mode: "finish", rows: 2, columns: 2, inTray: 1, fadedPicture: true },
  { level: 2, mode: "finish", rows: 3, columns: 3, inTray: 2, fadedPicture: true },
  { level: 3, mode: "jigsaw", rows: 2, columns: 3, inTray: 6, fadedPicture: true },
  { level: 4, mode: "jigsaw", rows: 3, columns: 4, inTray: 12, fadedPicture: false },
  { level: 5, mode: "jigsaw", rows: 5, columns: 7, inTray: 35, fadedPicture: false },
];

export const MAX_LEVEL = LEVELS.length;

/** Below this short side (CSS px) pieces get too small for a child's finger. */
export const SMALL_SCREEN_SHORT_SIDE = 700;

/**
 * The level to play, clamped to 1…5. On a small screen the 35-piece cut is
 * capped at level 4's 3 × 4.
 */
export function levelFor(level: number, shortSide: number): PuzzleLevel {
  const index = Math.min(Math.max(Math.round(level) || 1, 1), MAX_LEVEL) - 1;
  const chosen = LEVELS[index];
  if (chosen.level === MAX_LEVEL && shortSide < SMALL_SCREEN_SHORT_SIDE) {
    const cap = LEVELS[MAX_LEVEL - 2];
    return { ...chosen, rows: cap.rows, columns: cap.columns, inTray: cap.inTray };
  }
  return chosen;
}
