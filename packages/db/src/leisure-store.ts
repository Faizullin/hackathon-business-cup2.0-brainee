import { createHash, randomUUID } from "node:crypto";
import { spendPlayTime } from "@brainee/core";
import { eq, sql } from "drizzle-orm";
import { families, showcases } from "../schema";
import type { Database } from "./client";
import { LearningStoreError, requireAccess, writeTransaction } from "./learning-store";
export async function updateFunPlay(db: Database, token: string, raw: unknown, now: Date) {
  const input = (raw ?? {}) as {
    type?: string;
    gameId?: string;
    id?: string;
    sequence?: number;
    seconds?: number;
  };
  return writeTransaction(db, async (tx) => {
    const access = await requireAccess(tx, token, now);
    const row = await tx
      .select()
      .from(showcases)
      .where(eq(showcases.childId, access.childId))
      .get();
    const data = row?.data,
      game = data?.fun.find((g) => g.id === input.gameId);
    if (!data || !game || game.id !== "snake") throw new LearningStoreError("not-found");
    const device = createHash("sha256").update(`fun:${token}`).digest("hex");
    if (input.type === "start") {
      if (!game.forever && (game.remainingSeconds ?? 0) <= 0)
        throw new LearningStoreError("unauthorized");
      game.play = { id: randomUUID(), device, at: now.toISOString(), sequence: 0 };
    } else if (input.type === "tick") {
      const play = game.play;
      if (!play || play.id !== input.id || play.device !== device)
        throw new LearningStoreError("conflict");
      if (input.sequence === play.sequence)
        return { id: play.id, remainingSeconds: game.remainingSeconds ?? 0, forever: game.forever };
      if (input.sequence !== play.sequence + 1) throw new LearningStoreError("invalid-input");
      let remaining: number;
      try {
        remaining = spendPlayTime(
          game.remainingSeconds ?? 0,
          (now.getTime() - Date.parse(play.at)) / 1000,
          input.seconds as number,
        );
      } catch {
        throw new LearningStoreError("invalid-input");
      }
      if (!game.forever) game.remainingSeconds = remaining;
      play.sequence = input.sequence;
      play.at = now.toISOString();
    } else throw new LearningStoreError("invalid-input");
    await tx.update(showcases).set({ data }).where(eq(showcases.childId, access.childId));
    await tx
      .update(families)
      .set({ version: sql`${families.version} + 1` })
      .where(eq(families.id, access.familyId));
    return {
      id: game.play?.id,
      remainingSeconds: game.remainingSeconds ?? 0,
      forever: game.forever,
    };
  });
}
