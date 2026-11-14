import type { DefineContract } from "@brainee/game-bridge";
import manifest from "../manifest.json" with { type: "json" };

export const PICTURE_PUZZLE_CONTRACT = manifest.bridge.contract;
export const ROUNDS_PER_SESSION = manifest.roundsPerSession;

/**
 * The host supplies the issued level and seed. Standalone mode reads URL params.
 * Raw puzzle events remain available to adapters; only round/finish affect the host.
 */
export type PicturePuzzleContract = DefineContract<{
  config: { level: number; seed: number };
  events: {
    round: { correct: boolean; afterMistake: boolean };
    finish: {
      gameId: string;
      level: number;
      rounds: number;
      mistakes: number;
      corrections: number;
      durationMs: number;
    };
    puzzle_started: { level: number; picture: string; pieces: number };
    piece_placed: { piece: number; attempts: number };
    piece_rejected: { piece: number };
    hint_used: { piece?: number };
    puzzle_completed: { durationMs: number; hintsUsed: number };
  };
  state: { placed: number; total: number; level: number };
  methods: Record<string, never>;
}>;
