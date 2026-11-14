import type { DefineContract } from "@brainee/game-bridge";

export const SHAPE_PAIRS_CONTRACT = "shape-pairs@1";
export type ShapePairsContract = DefineContract<{
  config: null;
  events: {
    round_started: { level: number; shapes: string[] };
    pair_matched: { shape: string; attempts: number };
    pair_rejected: { shape: string; picked: string };
    hint_shown: { shape: string };
    round_completed: { durationMs: number; wrongTries: number };
  };
  state: { matched: number; total: number; level: number };
  methods: Record<string, never>;
}>;
