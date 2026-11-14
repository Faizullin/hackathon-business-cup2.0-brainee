import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import {
  applyShowcaseAction,
  applySkillGains,
  applyStatGains,
  type BrainyStats,
  PARENT_ACTIONS,
  parseShowcaseAction,
} from "@brainee/core";
import { eq, sql } from "drizzle-orm";
import { brainyStates, demoSessions, families, parents, showcases, wallets } from "../schema";
import type { Database } from "./client";
import { LearningStoreError, requireAccess, writeTransaction } from "./learning-store";
import { demoShowcase } from "./showcase-seed";

export const PARENT_UNLOCK_MS = 15 * 60 * 1000;

export class ShowcaseError extends Error {
  constructor(public readonly reason: string) {
    super(reason);
  }
}

function pinMatches(pin: string, pinHash: string) {
  const [scheme, salt, hex] = pinHash.split("$");
  if (scheme !== "scrypt" || !salt || !hex) return false;
  const expected = Buffer.from(hex, "hex");
  const actual = scryptSync(pin, salt, expected.length);
  return timingSafeEqual(actual, expected);
}

/** T-40 demo barrier: the PIN unlocks parent actions on this device only. */
export async function setParentUnlock(
  db: Database,
  tokenHash: string,
  pin: string | null,
  now: Date,
) {
  return writeTransaction(db, async (tx) => {
    const access = await requireAccess(tx, tokenHash, now);
    let until: Date | null = null;
    if (pin !== null) {
      const parent = await tx
        .select({ pinHash: parents.pinHash })
        .from(parents)
        .where(eq(parents.familyId, access.familyId))
        .get();
      if (!parent || !/^\d{4}$/.test(pin) || !pinMatches(pin, parent.pinHash)) return false;
      until = new Date(now.getTime() + PARENT_UNLOCK_MS);
    }
    await tx
      .update(demoSessions)
      .set({ parentUntil: until })
      .where(eq(demoSessions.tokenHash, tokenHash));
    // Device-local, but bump so this device's snapshot refreshes.
    await tx
      .update(families)
      .set({ version: sql`${families.version} + 1` })
      .where(eq(families.id, access.familyId));
    return true;
  });
}

/** Validates one demo action with core rules and saves showcase, wallet and stats together. */
export async function applyShowcase(db: Database, tokenHash: string, input: unknown, now: Date) {
  const action = parseShowcaseAction(input);
  if (!action) throw new LearningStoreError("invalid-input");
  return writeTransaction(db, async (tx) => {
    const access = await requireAccess(tx, tokenHash, now);
    if (PARENT_ACTIONS.has(action.type)) {
      const session = await tx
        .select({ parentUntil: demoSessions.parentUntil })
        .from(demoSessions)
        .where(eq(demoSessions.tokenHash, tokenHash))
        .get();
      if (!session?.parentUntil || session.parentUntil <= now)
        throw new LearningStoreError("unauthorized");
    }
    const row = await tx
      .select({ data: showcases.data })
      .from(showcases)
      .where(eq(showcases.childId, access.childId))
      .get();
    const wallet = await tx.select().from(wallets).where(eq(wallets.childId, access.childId)).get();
    const state = await tx
      .select()
      .from(brainyStates)
      .where(eq(brainyStates.childId, access.childId))
      .get();
    if (!row || !wallet || !state) throw new LearningStoreError("not-found");
    const outcome = applyShowcaseAction(
      {
        showcase: row.data,
        wallet: { stars: wallet.stars, suns: wallet.suns },
        now,
        id: randomUUID(),
      },
      action,
    );
    if (!outcome.ok) throw new ShowcaseError(outcome.reason);
    await tx
      .update(showcases)
      .set({ data: outcome.showcase })
      .where(eq(showcases.childId, access.childId));
    await tx.update(wallets).set(outcome.wallet).where(eq(wallets.childId, access.childId));
    if (outcome.gains.eyes || outcome.gains.resp) {
      const stats: BrainyStats = {
        brain: state.brain,
        eyes: state.eyes,
        mouth: state.mouth,
        arms: state.arms,
        legs: state.legs,
        resp: state.resp,
      };
      const skills = outcome.gains.eyes
        ? applySkillGains(state.skills, { attention: outcome.gains.eyes })
        : state.skills;
      await tx
        .update(brainyStates)
        .set({ ...applyStatGains(stats, outcome.gains), skills, updatedAt: now })
        .where(eq(brainyStates.childId, access.childId));
    }
    await tx
      .update(families)
      .set({ version: sql`${families.version} + 1` })
      .where(eq(families.id, access.familyId));
    return { ok: true as const };
  });
}

/** Demo only: restore the seeded showcase (tasks, gifts, videos) for a fresh presentation. */
export async function resetShowcase(db: Database, tokenHash: string, now: Date) {
  await writeTransaction(db, async (tx) => {
    const access = await requireAccess(tx, tokenHash, now);
    await tx
      .update(showcases)
      .set({ data: demoShowcase })
      .where(eq(showcases.childId, access.childId));
    await tx
      .update(families)
      .set({ version: sql`${families.version} + 1` })
      .where(eq(families.id, access.familyId));
  });
}
