import { isLearningProgress, type StateSnapshot } from "@brainee/core";
import { and, desc, eq, gt } from "drizzle-orm";
import {
  brainyStates,
  children,
  demoSessions,
  families,
  gameSessions,
  games,
  wallets,
} from "../schema";
import type { Database } from "./client";
import { LearningStoreError } from "./learning-store";

/** One SELECT gives version and all visible data the same SQLite read snapshot. */
export async function getStateSnapshot(
  db: Database,
  tokenHash: string,
  now: Date,
): Promise<StateSnapshot> {
  const latest = db
    .select({ id: gameSessions.id })
    .from(gameSessions)
    .where(and(eq(gameSessions.childId, children.id), eq(gameSessions.status, "completed")))
    .orderBy(desc(gameSessions.finishedAt), desc(gameSessions.id))
    .limit(1);
  const row = await db
    .select({
      version: families.version,
      child: { id: children.id, name: children.name, birthYear: children.birthYear },
      state: brainyStates,
      wallet: wallets,
      run: { inRow: demoSessions.inRow, bonusGiven: demoSessions.bonusGiven },
      last: gameSessions,
      gameTitle: games.title,
    })
    .from(demoSessions)
    .innerJoin(children, eq(children.id, demoSessions.childId))
    .innerJoin(families, eq(families.id, children.familyId))
    .innerJoin(brainyStates, eq(brainyStates.childId, children.id))
    .innerJoin(wallets, eq(wallets.childId, children.id))
    .leftJoin(gameSessions, eq(gameSessions.id, latest))
    .leftJoin(games, eq(games.id, gameSessions.gameId))
    .where(and(eq(demoSessions.tokenHash, tokenHash), gt(demoSessions.expiresAt, now)))
    .get();
  if (!row) throw new LearningStoreError("unauthorized");
  const { brain, eyes, mouth, arms, legs, resp, mood, startSnapshot } = row.state;
  const progress = {
    stats: { brain, eyes, mouth, arms, legs, resp },
    mood,
    wallet: { stars: row.wallet.stars, suns: row.wallet.suns },
    streak: row.run,
  };
  if (!isLearningProgress(progress) || !isLearningProgress({ ...progress, stats: startSnapshot }))
    throw new Error("Invalid saved child state.");
  return {
    version: row.version,
    child: row.child,
    progress,
    baseline: startSnapshot,
    latestGame:
      row.last?.finishedAt && row.last.starsEarned !== null
        ? {
            id: row.last.id,
            gameId: row.last.gameId,
            title: row.gameTitle ?? row.last.gameId,
            level: row.last.level,
            starsEarned: row.last.starsEarned,
            finishedAt: row.last.finishedAt.toISOString(),
          }
        : null,
  };
}
