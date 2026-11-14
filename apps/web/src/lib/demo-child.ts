import { BRAINY_PRESETS } from "@brainee/brainy";
import type { BrainyStats, Equipped, Wallet } from "@brainee/core";

// Fixture for the child shell until the demo session (T-52) and polled state (T-55) exist.
// Mirrors packages/db's demo seed (wallet 340★ / 6☀). Replace reads, don't add writes here.
export const demoChild: {
  name: string;
  stats: BrainyStats;
  equipped: Equipped;
  wallet: Wallet;
  mood: number;
  weekGoal: { earned: number; target: number; prize: string };
} = {
  name: "Саша",
  stats: { ...BRAINY_PRESETS.now },
  equipped: { face: "glasses" },
  wallet: { stars: 340, suns: 6 },
  mood: 72,
  weekGoal: { earned: 6, target: 10, prize: "Поход в кино" },
};
