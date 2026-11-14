import { createHash, randomInt } from "node:crypto";
import {
  adultAnswerCorrect,
  changeTimeZone,
  PAIRING_MS,
  pairingFailure,
  validChildSettings,
  validPin,
} from "@brainee/core";
import { and, eq, gt, sql } from "drizzle-orm";
import {
  children,
  demoSessions,
  families,
  pairingAttempts,
  pairingCodes,
  parents,
  showcases,
} from "../schema";
import { hashSecret, issueAccess, secretMatches } from "./account-store";
import { refreshCalendar } from "./calendar-store";
import type { Database } from "./client";
import { LearningStoreError, requireAccess, writeTransaction } from "./learning-store";
import { PARENT_UNLOCK_MS } from "./showcase-store";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const deviceId = (token: string) => hash(`device:${token}`);
type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];
export class SettingsError extends Error {
  constructor(public readonly reason: string) {
    super(reason);
  }
}
async function requireParent(tx: Tx, token: string, now: Date) {
  const access = await requireAccess(tx, token, now);
  const session = await tx
    .select()
    .from(demoSessions)
    .where(eq(demoSessions.tokenHash, token))
    .get();
  if (!session?.parentUntil || session.parentUntil <= now)
    throw new LearningStoreError("unauthorized");
  return access;
}
async function bump(tx: Tx, familyId: string) {
  await tx
    .update(families)
    .set({ version: sql`${families.version} + 1` })
    .where(eq(families.id, familyId));
}
export async function getSettings(db: Database, token: string, now: Date) {
  return writeTransaction(db, async (tx) => {
    const access = await requireParent(tx, token, now);
    const calendar = await refreshCalendar(tx, access, now);
    const child = await tx.select().from(children).where(eq(children.id, access.childId)).get();
    const parent = await tx
      .select({ email: parents.email })
      .from(parents)
      .where(eq(parents.familyId, access.familyId))
      .get();
    const devices = await tx
      .select({ tokenHash: demoSessions.tokenHash, createdAt: demoSessions.createdAt })
      .from(demoSessions)
      .innerJoin(children, eq(children.id, demoSessions.childId))
      .where(
        and(
          eq(children.familyId, access.familyId),
          eq(demoSessions.revoked, false),
          gt(demoSessions.expiresAt, now),
        ),
      );
    return {
      jury:
        (await tx.select().from(families).where(eq(families.id, access.familyId)).get())?.plan ===
        "jury",
      child: {
        name: child?.name ?? "",
        birthYear: child?.birthYear ?? 0,
        promise: calendar.showcase.childPromise ?? 3,
      },
      timeZone: calendar.showcase.calendar?.timeZone,
      email: parent?.email ?? "",
      devices: devices.map((d) => ({
        id: deviceId(d.tokenHash),
        createdAt: d.createdAt.toISOString(),
        current: d.tokenHash === token,
      })),
    };
  });
}
export async function updateSettings(db: Database, token: string, raw: unknown, now: Date) {
  const action = raw as {
    type?: string;
    child?: unknown;
    oldPin?: unknown;
    newPin?: unknown;
    timeZone?: unknown;
    deviceId?: unknown;
  } | null;
  return writeTransaction(db, async (tx) => {
    const access = await requireParent(tx, token, now);
    const calendar = await refreshCalendar(tx, access, now);
    if (action?.type === "child" && validChildSettings(action.child, now)) {
      await tx
        .update(children)
        .set({ name: action.child.name.trim(), birthYear: action.child.birthYear })
        .where(eq(children.id, access.childId));
      await tx
        .update(showcases)
        .set({ data: { ...calendar.showcase, childPromise: action.child.promise } })
        .where(eq(showcases.childId, access.childId));
    } else if (action?.type === "pin" && validPin(action.oldPin) && validPin(action.newPin)) {
      const parent = await tx
        .select()
        .from(parents)
        .where(eq(parents.familyId, access.familyId))
        .get();
      if (!parent || !secretMatches(action.oldPin, parent.pinHash))
        throw new SettingsError("wrong-pin");
      await tx
        .update(parents)
        .set({ pinHash: hashSecret(action.newPin) })
        .where(eq(parents.id, parent.id));
      // Existing elevations must not outlive a changed PIN; retain only this parent's device.
      const siblings = await tx
        .select({ id: children.id })
        .from(children)
        .where(eq(children.familyId, access.familyId));
      for (const child of siblings)
        await tx
          .update(demoSessions)
          .set({ parentUntil: null })
          .where(eq(demoSessions.childId, child.id));
      await tx
        .update(demoSessions)
        .set({ parentUntil: new Date(now.getTime() + PARENT_UNLOCK_MS) })
        .where(eq(demoSessions.tokenHash, token));
    } else if (action?.type === "timezone" && typeof action.timeZone === "string") {
      let changed: ReturnType<typeof changeTimeZone>;
      try {
        changed = changeTimeZone(calendar.showcase, action.timeZone, now);
      } catch {
        throw new LearningStoreError("invalid-input");
      }
      await tx
        .update(showcases)
        .set({ data: changed.showcase })
        .where(eq(showcases.childId, access.childId));
      if (changed.dayChanged)
        await tx
          .update(demoSessions)
          .set({ inRow: 0 })
          .where(eq(demoSessions.childId, access.childId));
    } else if (action?.type === "revoke" && typeof action.deviceId === "string") {
      const devices = await tx
        .select({ tokenHash: demoSessions.tokenHash })
        .from(demoSessions)
        .innerJoin(children, eq(children.id, demoSessions.childId))
        .where(eq(children.familyId, access.familyId));
      const found = devices.find((d) => deviceId(d.tokenHash) === action.deviceId);
      if (!found) throw new LearningStoreError("not-found");
      await tx
        .update(demoSessions)
        .set({ revoked: true, parentUntil: null })
        .where(eq(demoSessions.tokenHash, found.tokenHash));
    } else throw new LearningStoreError("invalid-input");
    await bump(tx, access.familyId);
    return { ok: true };
  });
}
export async function logoutDevice(db: Database, token: string, now: Date) {
  return writeTransaction(db, async (tx) => {
    const access = await requireAccess(tx, token, now);
    await tx
      .update(demoSessions)
      .set({ revoked: true, parentUntil: null })
      .where(eq(demoSessions.tokenHash, token));
    await bump(tx, access.familyId);
  });
}
export async function createPairingCode(db: Database, token: string, now: Date) {
  return writeTransaction(db, async (tx) => {
    const access = await requireParent(tx, token, now);
    let code = "";
    for (;;) {
      code = String(randomInt(1_000_000)).padStart(6, "0");
      if (
        !(await tx
          .select()
          .from(pairingCodes)
          .where(eq(pairingCodes.codeHash, hash(code)))
          .get())
      )
        break;
    }
    const expiresAt = new Date(now.getTime() + PAIRING_MS);
    await tx
      .insert(pairingCodes)
      .values({ childId: access.childId, codeHash: hash(code), expiresAt })
      .onConflictDoUpdate({
        target: pairingCodes.childId,
        set: { codeHash: hash(code), expiresAt },
      });
    return { code, expiresAt: expiresAt.toISOString() };
  });
}
/** The attempt key is server-derived from the request address, shared across cookie retries. */
export async function redeemPairingCode(
  db: Database,
  attemptKey: string,
  code: unknown,
  now: Date,
) {
  return writeTransaction(db, async (tx) => {
    const id = hash(`pair:${attemptKey}`);
    const previous = await tx
      .select()
      .from(pairingAttempts)
      .where(eq(pairingAttempts.id, id))
      .get();
    if (previous?.lockedUntil && previous.lockedUntil > now)
      return { error: "pairing-locked" as const };
    const row =
      typeof code === "string" && /^\d{6}$/.test(code)
        ? await tx
            .select()
            .from(pairingCodes)
            .where(and(eq(pairingCodes.codeHash, hash(code)), gt(pairingCodes.expiresAt, now)))
            .get()
        : undefined;
    if (!row) {
      const failure = pairingFailure(previous?.lockedUntil ? 0 : (previous?.attempts ?? 0), now);
      await tx
        .insert(pairingAttempts)
        .values({ id, ...failure })
        .onConflictDoUpdate({ target: pairingAttempts.id, set: failure });
      return { error: failure.lockedUntil ? ("pairing-locked" as const) : ("wrong-code" as const) };
    }
    // Consume before issuing the cookie, in the same write transaction.
    await tx.delete(pairingCodes).where(eq(pairingCodes.childId, row.childId));
    await tx.delete(pairingAttempts).where(eq(pairingAttempts.id, id));
    return { access: await issueAccess(tx, row.childId, now, false) };
  });
}
export async function unlockWithAdultTask(db: Database, token: string, answer: unknown, now: Date) {
  return writeTransaction(db, async (tx) => {
    const access = await requireAccess(tx, token, now);
    if (!adultAnswerCorrect(answer)) return false;
    await tx
      .update(demoSessions)
      .set({ parentUntil: new Date(now.getTime() + PARENT_UNLOCK_MS) })
      .where(eq(demoSessions.tokenHash, token));
    await bump(tx, access.familyId);
    return true;
  });
}
