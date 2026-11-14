export interface StickerLevel {
  level: number;
  /** Silhouettes to fill; the scene's other stickers are already in place. */
  count: number;
  /** Stickers with alike outlines may share a round. */
  mixGroups: boolean;
  /** The sticker shows faintly inside its silhouette. */
  fadedSticker: boolean;
}

export const LEVELS: readonly StickerLevel[] = [
  { level: 1, count: 3, mixGroups: false, fadedSticker: true },
  { level: 2, count: 4, mixGroups: false, fadedSticker: false },
  { level: 3, count: 6, mixGroups: false, fadedSticker: false },
  { level: 4, count: 8, mixGroups: true, fadedSticker: false },
  { level: 5, count: 12, mixGroups: true, fadedSticker: false },
];

export const MAX_LEVEL = LEVELS.length;

/** Below this short side (CSS px) twelve stickers are too many for a small tray. */
export const SMALL_SCREEN_SHORT_SIDE = 700;

/** The level to play, clamped to 1…5. On a small screen level 5 keeps level 4's count. */
export function levelFor(level: number, shortSide: number): StickerLevel {
  const index = Math.min(Math.max(Math.round(level) || 1, 1), MAX_LEVEL) - 1;
  const chosen = LEVELS[index];
  if (chosen.level === MAX_LEVEL && shortSide < SMALL_SCREEN_SHORT_SIDE) {
    return { ...chosen, count: LEVELS[MAX_LEVEL - 2].count };
  }
  return chosen;
}
