import type { DefineContract } from "@brainee/game-bridge";

export const COLOR_SORT_CONTRACT = "color-boxes@1";

/**
 * The game needs nothing from the host to start: it reads its level from saved
 * progress. Its events are game-only (event stream, never PECS analytics).
 */
export type ColorSortContract = DefineContract<{
  config: null;
  events: {
    round_started: {
      level: number;
      colors: string[];
      items: string[];
      boxes: number;
      perBox: number;
      locale: string;
    };
    item_sorted: { item: string; color: string; attempts: number };
    /** `box` is the wrong colour the picture was put in. */
    item_rejected: { item: string; box: string };
    hint_shown: { item: string };
    round_completed: { durationMs: number; wrongDrops: number };
  };
  state: { sorted: number; total: number; level: number };
  methods: Record<string, never>;
}>;
