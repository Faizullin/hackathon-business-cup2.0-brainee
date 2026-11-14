import type { DefineContract } from "@brainee/game-bridge";

export const STICKER_SCENE_CONTRACT = "sticker-scene@1";

/**
 * The game needs nothing from the host to start: it reads its level from saved
 * progress. Its events are game-only (event stream, never PECS analytics).
 */
export type StickerSceneContract = DefineContract<{
  config: null;
  events: {
    scene_started: { level: number; scene: string; stickers: string[] };
    sticker_placed: { sticker: string; attempts: number };
    /** `onSilhouette` names the wrong silhouette the sticker was put on, if any. */
    sticker_rejected: { sticker: string; onSilhouette?: string };
    hint_shown: { sticker: string };
    scene_completed: { durationMs: number; wrongDrops: number };
  };
  state: { placed: number; total: number; level: number };
  methods: Record<string, never>;
}>;
