import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import {
  addFeed,
  type BrainyStats,
  completeAppTasks,
  finishLearningSession,
  moodNow,
  parseLearningGameResult,
  parseLearningLaunch,
  reachedStage,
  stopForToday,
} from "@brainee/core";
import { and, eq, gt, sql } from "drizzle-orm";
import {
  brainyStates,
  children,
  demoSessions,
  families,
  gameSessions,
  games,
  showcases,
  wallets,
} from "../schema";
import { refreshCalendar } from "./calendar-store";
import type { Database } from "./client";
import { demo } from "./seed";

export class LearningStoreError extends Error {
  constructor(
    public readonly code:
      | "revoked"
      | "unauthorized"
      | "invalid-input"
      | "not-found"
      | "conflict"
      | "expired",
  ) {
    super(code);
  }
}

export const DEMO_ACCESS_MS = 7 * 24 * 60 * 60 * 1000;
export const GAME_SESSION_MS = 60 * 60 * 1000;
type Store = Pick<Database, "select" | "insert" | "update">;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export async function writeTransaction<T>(
  db: Database,
  work: (tx: Transaction) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.transaction(work);
    } catch (error) {
      let cause: unknown = error;
      let busy = false;
      while (cause instanceof Error) {
        if (
          "code" in cause &&
          typeof cause.code === "string" &&
          cause.code.startsWith("SQLITE_BUSY")
        ) {
          busy = true;
          break;
        }
        cause = cause.cause;
      }
      if (!busy || attempt >= 2) throw error;
      // Retry the whole rolled-back transaction, yielding so the other writer can commit.
      await delay(25 * (attempt + 1));
    }
  }
}

export function demoTokenHash(token: string | undefined) {
  return token && /^[a-f0-9]{64}$/.test(token)
    ? createHash("sha256").update(token).digest("hex")
    : null;
}

export async function findDemoAccess(db: Store, tokenHash: string, now: Date) {
  return db
    .select({
      tokenHash: demoSessions.tokenHash,
      childId: children.id,
      childName: children.name,
      familyId: children.familyId,
      expiresAt: demoSessions.expiresAt,
      inRow: demoSessions.inRow,
      bonusGiven: demoSessions.bonusGiven,
      revoked: demoSessions.revoked,
    })
    .from(demoSessions)
    .innerJoin(children, eq(children.id, demoSessions.childId))
    .where(and(eq(demoSessions.tokenHash, tokenHash), gt(demoSessions.expiresAt, now)))
    .get();
}

export async function requireAccess(db: Store, tokenHash: string, now: Date) {
  const access = await findDemoAccess(db, tokenHash, now);
  if (!access || access.revoked)
    throw new LearningStoreError(access?.revoked ? "revoked" : "unauthorized");
  return access;
}

export async function createDemoAccess(db: Database, now: Date) {
  if (process.env.BRAINEE_SHARED_DEMO !== "1") throw new LearningStoreError("unauthorized");
  const child = await db
    .select({ id: children.id, name: children.name, familyId: children.familyId })
    .from(children)
    .where(eq(children.id, demo.child.id))
    .get();
  if (!child) throw new LearningStoreError("not-found");
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(now.getTime() + DEMO_ACCESS_MS);
  await db.insert(demoSessions).values({
    tokenHash: demoTokenHash(token) as string,
    childId: child.id,
    createdAt: now,
    expiresAt,
  });
  return { token, expiresAt, child };
}

export async function startGameSession(db: Database, tokenHash: string, input: unknown, now: Date) {
  return writeTransaction(db, async (tx) => {
    const access = await requireAccess(tx, tokenHash, now);
    await refreshCalendar(tx, access, now);
    const gameId =
      input && typeof input === "object" && "gameId" in input && typeof input.gameId === "string"
        ? input.gameId
        : "";
    const game = await tx
      .select()
      .from(games)
      .where(and(eq(games.id, gameId), eq(games.enabled, true), eq(games.kind, "dev")))
      .get();
    if (!game) throw new LearningStoreError("invalid-input");
    const child = await tx
      .select({ birthYear: children.birthYear })
      .from(children)
      .where(eq(children.id, access.childId))
      .get();
    if (!child || now.getUTCFullYear() - child.birthYear < game.minAge)
      throw new LearningStoreError("invalid-input");
    const { recommended, ...launchFields } = input as Record<string, unknown>;
    if (recommended !== undefined && typeof recommended !== "boolean")
      throw new LearningStoreError("invalid-input");
    const launch = parseLearningLaunch(launchFields, game);
    if (!launch) throw new LearningStoreError("invalid-input");
    const session = {
      id: randomUUID(),
      childId: access.childId,
      demoSessionHash: tokenHash,
      gameId,
      level: launch.level,
      seed: launch.seed ?? randomInt(0x100000000),
      startedAt: now,
      recommended: !!(
        input &&
        typeof input === "object" &&
        "recommended" in input &&
        input.recommended === true
      ),
    };
    await tx.insert(gameSessions).values(session);
    return {
      sessionId: session.id,
      gameId,
      level: session.level,
      seed: session.seed,
      startedAt: now,
      expiresAt: new Date(now.getTime() + GAME_SESSION_MS),
    };
  });
}

/** A write transaction locks before reading: concurrent retries cannot reward twice. */
export async function finishGameSession(
  db: Database,
  tokenHash: string,
  sessionId: string,
  input: unknown,
  now: Date,
) {
  return writeTransaction(db, async (tx) => {
    const access = await requireAccess(tx, tokenHash, now);
    const session = await tx
      .select()
      .from(gameSessions)
      .where(
        and(
          eq(gameSessions.id, sessionId),
          eq(gameSessions.childId, access.childId),
          eq(gameSessions.demoSessionHash, tokenHash),
        ),
      )
      .get();
    if (!session) throw new LearningStoreError("not-found");
    const game = await tx.select().from(games).where(eq(games.id, session.gameId)).get();
    if (!game) throw new LearningStoreError("not-found");
    const result = parseLearningGameResult(input, game);
    if (!result || result.level !== session.level) throw new LearningStoreError("invalid-input");
    const resultKey = JSON.stringify(result);
    if (session.status === "completed") {
      if (session.resultKey !== resultKey || !session.completion)
        throw new LearningStoreError("conflict");
      return { replayed: true, completion: session.completion };
    }
    if (session.status !== "pending") throw new LearningStoreError("conflict");
    if (!game.enabled || game.kind !== "dev") throw new LearningStoreError("invalid-input");
    const elapsed = now.getTime() - session.startedAt.getTime();
    if (elapsed < 0 || elapsed > GAME_SESSION_MS) throw new LearningStoreError("expired");
    // Client timing can differ slightly; the issued server window remains authoritative.
    if (result.durationMs > elapsed + 5000) throw new LearningStoreError("invalid-input");
    const calendar = await refreshCalendar(tx, access, now);
    const state = await tx
      .select()
      .from(brainyStates)
      .where(eq(brainyStates.childId, access.childId))
      .get();
    const wallet = await tx.select().from(wallets).where(eq(wallets.childId, access.childId)).get();
    if (!state || !wallet) throw new LearningStoreError("not-found");
    const stats: BrainyStats = {
      brain: state.brain,
      eyes: state.eyes,
      mouth: state.mouth,
      arms: state.arms,
      legs: state.legs,
      resp: state.resp,
    };
    const completion = finishLearningSession(
      {
        stats,
        skills: state.skills,
        wallet: { stars: wallet.stars, suns: wallet.suns },
        mood: moodNow(state.mood, state.updatedAt, now),
        streak: {
          inRow: calendar.dayChanged ? 0 : access.inRow,
          bonusGiven: calendar.showcase.calendar?.bonusGiven ?? false,
        },
      },
      result,
      game.weights,
    );
    const appTasks = completeAppTasks(calendar.showcase, completion.after.wallet, now);
    completion.after.wallet = appTasks.wallet;
    await tx
      .update(wallets)
      .set(completion.after.wallet)
      .where(eq(wallets.childId, access.childId));
    await tx
      .update(brainyStates)
      .set({
        ...completion.after.stats,
        skills: completion.after.skills,
        mood: completion.after.mood,
        updatedAt: now,
      })
      .where(eq(brainyStates.childId, access.childId));
    const data = appTasks.showcase;
    if (data.calendar) data.calendar.bonusGiven = completion.after.streak.bonusGiven;
    addFeed(data, {
      at: now.toISOString(),
      kind: "game",
      title: `${game.title} · ${result.level}`,
      amount: completion.earnedStars,
    });
    const stage = reachedStage(completion.before.stats, completion.after.stats);
    if (stage) addFeed(data, { at: now.toISOString(), kind: "stage-up", title: stage });
    await tx.update(showcases).set({ data }).where(eq(showcases.childId, access.childId));
    await tx
      .update(demoSessions)
      .set(completion.after.streak)
      .where(eq(demoSessions.tokenHash, tokenHash));
    await tx
      .update(families)
      .set({ version: sql`${families.version} + 1` })
      .where(eq(families.id, access.familyId));
    await tx
      .update(gameSessions)
      .set({
        status: "completed",
        rounds: result.rounds,
        mistakes: result.mistakes,
        corrections: result.corrections,
        durationMs: result.durationMs,
        starsEarned: completion.earnedStars,
        resultKey,
        completion,
        finishedAt: now,
      })
      .where(eq(gameSessions.id, sessionId));
    return { replayed: false, completion };
  });
}

export async function stopGameRun(db: Database, tokenHash: string, now: Date) {
  await writeTransaction(db, async (tx) => {
    const access = await requireAccess(tx, tokenHash, now);
    const calendar = await refreshCalendar(tx, access, now);
    await tx
      .update(demoSessions)
      .set(stopForToday({ inRow: 0, bonusGiven: calendar.showcase.calendar?.bonusGiven ?? false }))
      .where(eq(demoSessions.tokenHash, tokenHash));
    await tx
      .update(gameSessions)
      .set({ status: "abandoned", finishedAt: now })
      .where(and(eq(gameSessions.demoSessionHash, tokenHash), eq(gameSessions.status, "pending")));
    // Run state is part of /api/state too; other tabs must observe a stop.
    await tx
      .update(families)
      .set({ version: sql`${families.version} + 1` })
      .where(eq(families.id, access.familyId));
  });
}
