import { scryptSync } from "node:crypto";
import { type BrainyStats, finishLearningSession, type GameResult } from "@brainee/core";
import {
  brainyStates,
  children,
  families,
  gameSessions,
  games,
  parents,
  showcases,
  wallets,
} from "../schema";
import type { Database } from "./client";
import { demoShowcase } from "./showcase-seed";

const stats: BrainyStats = { brain: 66, eyes: 41, mouth: 55, arms: 70, legs: 64, resp: 80 };
const historicalResult: GameResult = {
  gameId: "odd-one-out",
  level: 1,
  rounds: 4,
  mistakes: 0,
  corrections: 0,
  durationMs: 60000,
};
const historicalCompletion = finishLearningSession(
  {
    stats: { ...stats, eyes: 38 },
    wallet: { stars: 328, suns: 6 },
    mood: 64,
    streak: { inRow: 0, bonusGiven: false },
  },
  historicalResult,
);
// Public demo PIN only, salted/hashed at rest. The parent barrier is T-40.
const pinSalt = "brainee-demo-parent-v1";

export const demo = {
  family: {
    id: "demo-family",
    plan: "demo",
    version: 0,
    createdAt: new Date("2026-11-14T00:00:00Z"),
  },
  parent: {
    id: "demo-parent",
    familyId: "demo-family",
    email: "parent@brainee.test",
    pinHash: `scrypt$${pinSalt}$${scryptSync("1234", pinSalt, 64).toString("hex")}`,
  },
  child: { id: "demo-child", familyId: "demo-family", name: "Саша", birthYear: 2020 },
  wallet: { childId: "demo-child", stars: 340, suns: 6 },
  brainy: {
    childId: "demo-child",
    ...stats,
    mood: 72,
    startSnapshot: { brain: 18, eyes: 16, mouth: 14, arms: 14, legs: 18, resp: 10 },
    updatedAt: new Date("2026-11-14T00:00:00Z"),
  },
  games: [
    {
      id: "odd-one-out",
      title: "Найди лишний",
      kind: "dev",
      mainSkill: "attention",
      secondarySkill: null,
      levels: 2,
      roundsPerSession: 4,
      enabled: true,
    },
    {
      id: "continue-pattern",
      title: "Продолжи узор",
      kind: "dev",
      mainSkill: "logic",
      secondarySkill: "attention",
      levels: 2,
      roundsPerSession: 4,
      enabled: true,
    },
  ],
  history: {
    id: "demo-completed-game",
    childId: "demo-child",
    demoSessionHash: null,
    ...historicalResult,
    seed: 42,
    status: "completed",
    starsEarned: historicalCompletion.earnedStars,
    resultKey: JSON.stringify(historicalResult),
    completion: historicalCompletion,
    startedAt: new Date("2026-11-13T23:59:00Z"),
    finishedAt: new Date("2026-11-14T00:00:00Z"),
  },
} as const;

// Fixture data only. Economy and stat calculations stay in packages/core.
export async function seedDemo(db: Database) {
  await db.transaction(async (transaction) => {
    await transaction.insert(families).values(demo.family).onConflictDoNothing();
    await transaction.insert(parents).values(demo.parent).onConflictDoNothing();
    await transaction.insert(children).values(demo.child).onConflictDoNothing();
    await transaction.insert(wallets).values(demo.wallet).onConflictDoNothing();
    await transaction.insert(brainyStates).values(demo.brainy).onConflictDoNothing();
    await transaction
      .insert(games)
      .values([...demo.games])
      .onConflictDoNothing();
    await transaction.insert(gameSessions).values(demo.history).onConflictDoNothing();
    await transaction
      .insert(showcases)
      .values({ childId: demo.child.id, data: demoShowcase })
      .onConflictDoNothing();
  });
}
