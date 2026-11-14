import type { LearningProgress } from "./learning";
import type { Showcase } from "./showcase";
import type { BrainyStats } from "./types";

/** Public child data only; dates cross the API as ISO strings. */
export type StateSnapshot = {
  version: number;
  learningHistory?: import("./recommendations").PlayedGame[];
  activity?: import("./activity").ActivitySummary;
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
  /** Seeded demo content and its interactive state (D-21). */
  showcase: Showcase;
  /** The parent PIN was entered on this device and has not expired. */
  parentUnlocked: boolean;
};

export type StateReply =
  | { changed: false; version: number }
  | { changed: true; snapshot: StateSnapshot };
