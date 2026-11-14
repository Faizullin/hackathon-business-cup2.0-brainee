export interface SortLevel {
  level: number;
  /** Toy boxes, one per colour. */
  boxes: number;
  /** Pictures the child sorts into each box. */
  perBox: number;
  /** Each box starts with one picture of its colour in it, so the rule shows itself. */
  example: boolean;
  /** Colours too alike (see `CLOSE_PAIRS`) may share the round, and any of the eight may come. */
  hard: boolean;
}

export const LEVELS: readonly SortLevel[] = [
  { level: 1, boxes: 2, perBox: 2, example: true, hard: false },
  { level: 2, boxes: 3, perBox: 2, example: true, hard: false },
  { level: 3, boxes: 3, perBox: 3, example: false, hard: false },
  { level: 4, boxes: 4, perBox: 3, example: false, hard: true },
  { level: 5, boxes: 4, perBox: 4, example: false, hard: true },
];

export const MAX_LEVEL = LEVELS.length;

/** The level to play, clamped to 1…5. */
export function levelFor(level: number): SortLevel {
  const index = Math.min(Math.max(Math.round(level) || 1, 1), MAX_LEVEL) - 1;
  return LEVELS[index];
}

/** The most pictures one box ever holds: an example plus its pictures. */
export const BOX_CAPACITY = Math.max(
  ...LEVELS.map((level) => level.perBox + (level.example ? 1 : 0)),
);
