import type { LearningProgress } from "./learning";
import type { BrainyStats } from "./types";

/** Public child data only; dates cross the API as ISO strings. */
export type StateSnapshot = {
  version: number;
  child: { id: string; name: string; birthYear: number };
  progress: LearningProgress;
  baseline: BrainyStats;
  latestGame: {
    id: string;
    gameId: string;
    title: string;
    level: number;
    starsEarned: number;
    finishedAt: string;
  } | null;
};

export type StateReply =
  | { changed: false; version: number }
  | { changed: true; snapshot: StateSnapshot };
