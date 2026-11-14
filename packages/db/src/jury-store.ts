import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { advanceCalendar, EARNED_THRESHOLDS, NEUTRAL_QUIZ } from "@brainee/core";
import { and, eq, lt } from "drizzle-orm";
import { brainyStates, demoSessions, families, showcases, wallets } from "../schema";
import { signupFromQuiz } from "./account-store";
import type { Database } from "./client";
import {
  demoTokenHash,
  finishGameSession,
  startGameSession,
  writeTransaction,
} from "./learning-store";
import { demoShowcase } from "./showcase-seed";

export async function createJuryFamily(db: Database, now: Date) {
  await writeTransaction(db, async (tx) => {
    await tx
      .delete(families)
      .where(
        and(
          eq(families.plan, "jury"),
          lt(families.createdAt, new Date(now.getTime() - 7 * 86400000)),
        ),
      );
  });
  const credentials = {
    email: `jury-${randomUUID()}@brainee.example`,
    password: randomBytes(9).toString("base64url"),
    pin: String(randomInt(10000)).padStart(4, "0"),
  };
  const access = await signupFromQuiz(
    db,
    {
      ...credentials,
      childName: "Ava",
      birthYear: now.getUTCFullYear() - 6,
      answers: NEUTRAL_QUIZ,
      timeZone: "America/New_York",
    },
    now,
    "jury",
  );
  const token = demoTokenHash(access.token) as string;
  for (let day = EARNED_THRESHOLDS.explorerGames - 1; day >= 1; day--) {
    const start = new Date(now.getTime() - Math.ceil(day / 3) * 86400000 + day * 240000);
    const gameId = day % 2 ? "odd-one-out" : "continue-pattern";
    const session = await startGameSession(
      db,
      token,
      { gameId, level: 1, recommended: true },
      start,
    );
    await finishGameSession(
      db,
      token,
      session.sessionId,
      { gameId, level: 1, rounds: 4, mistakes: 0, corrections: 0, durationMs: 180000 },
      new Date(start.getTime() + 180000),
    );
  }
  await writeTransaction(db, async (tx) => {
    await tx
      .update(demoSessions)
      .set({ inRow: 0, bonusGiven: false })
      .where(eq(demoSessions.childId, access.child.id));
    const data = advanceCalendar(structuredClone(demoShowcase), now).showcase;
    data.earned = [];
    data.tasks[0] = {
      id: "jury-app",
      title: "Play a learning game",
      place: "app",
      skill: "Logic",
      reward: 15,
      status: "todo",
    };
    data.entryLog = { took: 9, other: 3 };
    data.requests = data.requests.map((r) => ({ ...r, delivered: false, at: now.toISOString() }));
    data.feed = [{ kind: "game", at: now.toISOString(), title: "Demo history", amount: 12 }];
    data.fun = data.fun.map((g) => ({ ...g, forever: false, until: null, remainingSeconds: 0 }));
    await tx.update(showcases).set({ data }).where(eq(showcases.childId, access.child.id));
    await tx
      .update(brainyStates)
      .set({ resp: 68, updatedAt: now })
      .where(eq(brainyStates.childId, access.child.id));
    await tx
      .update(wallets)
      .set({ stars: 340, suns: 6 })
      .where(eq(wallets.childId, access.child.id));
  });
  return { ...access, credentials };
}
