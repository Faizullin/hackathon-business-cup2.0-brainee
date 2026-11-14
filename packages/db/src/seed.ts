import { scryptSync } from "node:crypto";
import {
  type BrainyStats,
  EARNED_THRESHOLDS,
  finishLearningSession,
  type GameResult,
} from "@brainee/core";
import { manifests } from "@brainee/game-catalog";
import { eq, sql } from "drizzle-orm";
import {
  brainyStates,
  children,
  demoSessions,
  families,
  gameSessions,
  games,
  pairingCodes,
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
    skills: { speech: 62, reading: 48, logic: 78, attention: 38, memory: 55, motor: 70 },
    wallet: { stars: 328, suns: 6 },
    mood: 64,
    streak: { inRow: 0, bonusGiven: false },
  },
  historicalResult,
  { attention: 1 },
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
    // Demo login from the MVP prototype: mom@example.com / demo1234 (public demo credentials).
    email: "mom@example.com",
    pinHash: `scrypt$${pinSalt}$${scryptSync("1234", pinSalt, 64).toString("hex")}`,
    passwordHash: `scrypt$${pinSalt}$${scryptSync("demo1234", pinSalt, 64).toString("hex")}`,
  },
  child: { id: "demo-child", familyId: "demo-family", name: "Mia", birthYear: 2020 },
  wallet: { childId: "demo-child", stars: 340, suns: 6 },
  brainy: {
    childId: "demo-child",
    ...stats,
    mood: 72,
    skills: { speech: 62, reading: 48, logic: 78, attention: 41, memory: 55, motor: 70 },
    startSnapshot: { brain: 18, eyes: 16, mouth: 14, arms: 14, legs: 18, resp: 10 },
    updatedAt: new Date("2026-11-14T00:00:00Z"),
  },
  games: manifests.map((game) => ({
    id: game.id,
    title: game.title,
    kind: game.kind,
    mainSkill: game.skills.main,
    secondarySkill: game.skills.secondary ?? null,
    weights: game.weights,
    minAge: game.minAge,
    levels: game.levels,
    roundsPerSession: game.roundsPerSession,
    enabled: true,
    runtime: game.runtime,
    runtimeUrl: game.runtime === "embedded" ? game.entry : null,
  })),
  history: {
    id: "demo-completed-game",
    childId: "demo-child",
    demoSessionHash: null,
    ...historicalResult,
    seed: 42,
    recommended: false,
    status: "completed",
    starsEarned: historicalCompletion.earnedStars,
    resultKey: JSON.stringify(historicalResult),
    completion: historicalCompletion,
    startedAt: new Date(Date.now() - 86400000 - 60000),
    finishedAt: new Date(Date.now() - 86400000),
  },
} as const;

const CATALOG_COLUMNS = [
  "title",
  "kind",
  "mainSkill",
  "secondarySkill",
  "weights",
  "minAge",
  "levels",
  "roundsPerSession",
  "runtime",
  "runtimeUrl",
] as const;

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
      // The manifests own catalog content (titles, weights, runtime); `enabled` stays an operator switch.
      .onConflictDoUpdate({
        target: games.id,
        set: Object.fromEntries(
          CATALOG_COLUMNS.map((column) => [column, sql.raw(`excluded.${games[column].name}`)]),
        ),
      });
    await transaction.insert(gameSessions).values(demo.history).onConflictDoNothing();
    // Ten completed games over the previous six days: badge is earned; one game today earns the garden.
    for (let i = 1; i < EARNED_THRESHOLDS.explorerGames; i++) {
      const finishedAt = new Date(
        demo.history.finishedAt.getTime() - Math.floor((i * 6) / 10) * 86400000 - i * 60000,
      );
      await transaction
        .insert(gameSessions)
        .values({
          ...demo.history,
          id: `demo-history-${i}`,
          startedAt: new Date(finishedAt.getTime() - 60000),
          finishedAt,
        })
        .onConflictDoNothing();
    }
    await transaction
      .insert(showcases)
      .values({ childId: demo.child.id, data: demoShowcase })
      .onConflictDoNothing();
  });
}

/**
 * Replace only the shared demo family with the current seed (other and jury families stay).
 * Explicit child-first deletes, because remote libSQL connections may not enforce cascades.
 */
export async function refreshDemo(db: Database) {
  const childId = demo.child.id;
  await db.transaction(async (transaction) => {
    await transaction.delete(gameSessions).where(eq(gameSessions.childId, childId));
    await transaction.delete(demoSessions).where(eq(demoSessions.childId, childId));
    await transaction.delete(pairingCodes).where(eq(pairingCodes.childId, childId));
    await transaction.delete(showcases).where(eq(showcases.childId, childId));
    await transaction.delete(brainyStates).where(eq(brainyStates.childId, childId));
    await transaction.delete(wallets).where(eq(wallets.childId, childId));
    await transaction.delete(children).where(eq(children.id, childId));
    await transaction.delete(parents).where(eq(parents.familyId, demo.family.id));
    await transaction.delete(families).where(eq(families.id, demo.family.id));
  });
  await seedDemo(db);
}
