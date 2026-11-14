import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, it, onTestFinished } from "vitest";
import { brainyStates, children, demoSessions, showcases, wallets } from "../schema";
import { resetDatabase } from "../scripts/database-tools";
import { openDatabase } from "./client";
import { getDatabaseConfig } from "./config";
import {
  createDemoAccess,
  demoTokenHash,
  finishGameSession,
  startGameSession,
  stopGameRun,
} from "./learning-store";
import { demo } from "./seed";
import { demoShowcase } from "./showcase-seed";
import { applyShowcase, setParentUnlock } from "./showcase-store";
import { getStateSnapshot } from "./state-store";

const now = new Date("2026-11-14T12:00:00Z");
async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), "brainee-state-"));
  const config = getDatabaseConfig(pathToFileURL(join(directory, "test.db")).href);
  await resetDatabase(config);
  const connection = await openDatabase(config);
  const observer = await openDatabase(config);
  onTestFinished(async () => {
    connection.client.close();
    observer.client.close();
    await rm(directory, { recursive: true, force: true });
  });
  const access = await createDemoAccess(connection.db, now);
  return { ...connection, observer, hash: demoTokenHash(access.token) as string };
}

it("returns only the authenticated child's public snapshot and seeded history", async () => {
  const f = await fixture();
  const snapshot = await getStateSnapshot(f.db, f.hash, now);
  expect(snapshot).toMatchObject({
    version: 0,
    child: { id: demo.child.id, name: demo.child.name, birthYear: demo.child.birthYear },
    progress: {
      stats: { eyes: 41 },
      wallet: { stars: 340, suns: 6 },
      mood: 72,
      streak: { inRow: 0, bonusGiven: false },
    },
    baseline: demo.brainy.startSnapshot,
    latestGame: {
      id: demo.history.id,
      gameId: "odd-one-out",
      starsEarned: 12,
      finishedAt: demo.history.finishedAt.toISOString(),
    },
  });
  expect(Object.keys(snapshot).sort()).toEqual([
    "baseline",
    "child",
    "latestGame",
    "parentUnlocked",
    "progress",
    "showcase",
    "version",
  ]);
  expect(JSON.stringify(snapshot)).not.toMatch(/pinHash|email|tokenHash|scrypt/);
  await expect(getStateSnapshot(f.db, "missing", now)).rejects.toMatchObject({
    code: "unauthorized",
  });
  await expect(getStateSnapshot(f.db, f.hash, new Date("2026-11-22"))).rejects.toMatchObject({
    code: "unauthorized",
  });
});

it("other connections see each committed version with the matching wallet, Brainy and latest game", async () => {
  const f = await fixture();
  const observerAccess = await createDemoAccess(f.observer.db, now);
  const observerHash = demoTokenHash(observerAccess.token) as string;
  const launch = await startGameSession(f.db, f.hash, { gameId: "odd-one-out", level: 1 }, now);
  const finished = new Date(now.getTime() + 2000);
  await finishGameSession(
    f.db,
    f.hash,
    launch.sessionId,
    {
      gameId: launch.gameId,
      level: launch.level,
      rounds: 4,
      mistakes: 0,
      corrections: 0,
      durationMs: 1000,
    },
    finished,
  );
  expect(await getStateSnapshot(f.observer.db, observerHash, finished)).toMatchObject({
    version: 1,
    progress: { stats: { eyes: 44 }, wallet: { stars: 352 }, streak: { inRow: 0 } },
    latestGame: { id: launch.sessionId, finishedAt: finished.toISOString() },
  });
  expect((await getStateSnapshot(f.db, f.hash, finished)).progress.streak.inRow).toBe(1);
  await stopGameRun(f.db, f.hash, finished);
  expect(await getStateSnapshot(f.observer.db, observerHash, finished)).toMatchObject({
    version: 2,
    progress: { wallet: { stars: 352 } },
    latestGame: { id: launch.sessionId },
  });
  expect((await getStateSnapshot(f.db, f.hash, finished)).progress.streak.inRow).toBe(0);
});

it("does not mix a sibling's stats, wallet or game history into a snapshot", async () => {
  const f = await fixture();
  await f.db.insert(children).values({ ...demo.child, id: "sibling", name: "Миша" });
  await f.db.insert(wallets).values({ childId: "sibling", stars: 1, suns: 2 });
  await f.db.insert(brainyStates).values({ ...demo.brainy, childId: "sibling", eyes: 99 });
  await f.db.insert(showcases).values({ childId: "sibling", data: demoShowcase });
  await f.db.insert(demoSessions).values({
    tokenHash: "sibling-access",
    childId: "sibling",
    createdAt: now,
    expiresAt: new Date("2026-11-15"),
  });
  expect(await getStateSnapshot(f.db, "sibling-access", now)).toMatchObject({
    child: { id: "sibling", name: "Миша" },
    progress: { stats: { eyes: 99 }, wallet: { stars: 1, suns: 2 } },
    latestGame: null,
  });
  expect((await getStateSnapshot(f.db, f.hash, now)).progress.wallet.stars).toBe(340);
});

it("rejects corrupt stored state instead of presenting a made-up baseline", async () => {
  const f = await fixture();
  await f.client.execute("UPDATE brainy_states SET start_snapshot = '{}'");
  await expect(getStateSnapshot(f.db, f.hash, now)).rejects.toThrow("Invalid saved child state");
});

it("parent actions need the PIN; a confirmed task pays suns and bumps the version", async () => {
  const f = await fixture();
  const access = await createDemoAccess(f.db, now);
  const hash = demoTokenHash(access.token) as string;
  const before = await getStateSnapshot(f.db, hash, now);
  expect(before.parentUnlocked).toBe(false);
  await expect(
    applyShowcase(f.db, hash, { type: "task-confirm", taskId: "t2" }, now),
  ).rejects.toMatchObject({
    code: "unauthorized",
  });
  expect(await setParentUnlock(f.db, hash, "0000", now)).toBe(false);
  expect(await setParentUnlock(f.db, hash, "1234", now)).toBe(true);
  await applyShowcase(f.db, hash, { type: "task-confirm", taskId: "t2" }, now);
  const after = await getStateSnapshot(f.db, hash, now);
  expect(after.parentUnlocked).toBe(true);
  expect(after.progress.wallet.suns).toBe(before.progress.wallet.suns + 2);
  expect(after.progress.stats.resp).toBe(Math.min(100, before.progress.stats.resp + 2));
  expect(after.version).toBeGreaterThan(before.version);
  await expect(applyShowcase(f.db, hash, { type: "nope" }, now)).rejects.toMatchObject({
    code: "invalid-input",
  });
});
