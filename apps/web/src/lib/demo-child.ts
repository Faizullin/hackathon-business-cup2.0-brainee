import type { Equipped } from "@brainee/core";

// Presentation for features outside the connected-demo data slice (T-38/T-46).
// Brainy stats, mood, identity and currencies come only from /api/state.
export const demoChild: {
  equipped: Equipped;
  weekGoal: { earned: number; target: number; prize: string };
} = {
  equipped: { face: "glasses" },
  weekGoal: { earned: 6, target: 10, prize: "Поход в кино" },
};
