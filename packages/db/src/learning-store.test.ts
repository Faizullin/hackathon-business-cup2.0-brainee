import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { eq } from "drizzle-orm";
import { expect, it, onTestFinished } from "vitest";
import { brainyStates, demoSessions, families, gameSessions, wallets } from "../schema";
import { resetDatabase } from "../scripts/database-tools";
import { openDatabase } from "./client";
import { getDatabaseConfig } from "./config";
import {
  createDemoAccess,
  DEMO_ACCESS_MS,
  demoTokenHash,
  findDemoAccess,
  finishGameSession,
  GAME_SESSION_MS,
  startGameSession,
  stopGameRun,
} from "./learning-store";
import { demo } from "./seed";

const now = new Date("2026-11-14T12:00:00Z");
const later = (ms: number) => new Date(now.getTime() + ms);
const launch = { gameId: "odd-one-out", level: 1, seed: 42 };
const result = {
  gameId: "odd-one-out",
  level: 1,
  rounds: 4,
  mistakes: 0,
  corrections: 0,
  durationMs: 1000,
};

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), "brainee-learning-"));
  const config = getDatabaseConfig(pathToFileURL(join(directory, "test.db")).href);
  await resetDatabase(config);
  const connection = await openDatabase(config);
  const connections = [connection];
  onTestFinished(async () => {
    for (const c of connections) if (!c.client.closed) c.client.close();
    await rm(directory, { recursive: true, force: true });
  });
  const access = await createDemoAccess(connection.db, now);
  const hash = demoTokenHash(access.token) as string;
  return {
    ...connection,
    config,
    access,
    hash,
    async connect() {
      const other = await openDatabase(config);
      connections.push(other);
      return other;
    },
  };
}

it("stores only an opaque token hash and expires access without process memory", async () => {
  const f = await fixture();
  const stored = await f.db.select().from(demoSessions).get();
  expect(stored?.tokenHash).toBe(f.hash);
  expect(stored?.tokenHash).not.toBe(f.access.token);
  expect(demoTokenHash("forged")).toBeNull();
  const other = await f.connect();
  expect((await findDemoAccess(other.db, f.hash, later(1)))?.childId).toBe(demo.child.id);
  expect(await findDemoAccess(other.db, f.hash, later(DEMO_ACCESS_MS))).toBeUndefined();
  await expect(startGameSession(other.db, "missing", launch, now)).rejects.toMatchObject({
    code: "unauthorized",
  });
});

it("atomically persists a result, Brainy, wallet, streak and family version across connections", async () => {
  const f = await fixture();
  const session = await startGameSession(f.db, f.hash, launch, now);
  expect(session).toMatchObject({ gameId: launch.gameId, level: 1, seed: 42 });
  const saved = await finishGameSession(f.db, f.hash, session.sessionId, result, later(2000));
  expect(saved).toMatchObject({
    replayed: false,
    completion: {
      gains: { eyes: 3 },
      earnedStars: 12,
      after: { wallet: { stars: 352, suns: 6 }, mood: 80, streak: { inRow: 1 } },
    },
  });
  const other = await f.connect();
  expect(await other.db.select().from(wallets).get()).toEqual({ ...demo.wallet, stars: 352 });
  expect(await other.db.select().from(brainyStates).get()).toMatchObject({
    eyes: 44,
    mood: 80,
    startSnapshot: demo.brainy.startSnapshot,
    updatedAt: later(2000),
  });
  expect((await other.db.select().from(families).get())?.version).toBe(1);
  expect(
    await other.db.select().from(gameSessions).where(eq(gameSessions.id, session.sessionId)).get(),
  ).toMatchObject({
    status: "completed",
    starsEarned: 12,
    rounds: 4,
    mistakes: 0,
    corrections: 0,
    completion: saved.completion,
  });
});

it("returns the original receipt on an identical retry, even after other games or launch expiry", async () => {
  const f = await fixture();
  const session = await startGameSession(f.db, f.hash, launch, now);
  const first = await finishGameSession(f.db, f.hash, session.sessionId, result, later(2000));
  const next = await startGameSession(
    f.db,
    f.hash,
    { gameId: "continue-pattern", level: 2 },
    later(3000),
  );
  await finishGameSession(
    f.db,
    f.hash,
    next.sessionId,
    { ...result, gameId: "continue-pattern", level: 2, mistakes: 1, corrections: 1 },
    later(5000),
  );
  const retry = await finishGameSession(
    f.db,
    f.hash,
    session.sessionId,
    { durationMs: 1000, corrections: 0, mistakes: 0, rounds: 4, level: 1, gameId: "odd-one-out" },
    later(GAME_SESSION_MS + 1),
  );
  expect(retry).toEqual({ replayed: true, completion: first.completion });
  expect((await f.db.select().from(wallets).get())?.stars).toBe(365);
  expect((await f.db.select().from(brainyStates).get())?.brain).toBe(68);
  expect((await f.db.select().from(families).get())?.version).toBe(2);
});

it("rejects a conflicting retry without changing saved rewards", async () => {
  const f = await fixture();
  const session = await startGameSession(f.db, f.hash, launch, now);
  await finishGameSession(f.db, f.hash, session.sessionId, result, later(2000));
  await expect(
    finishGameSession(
      f.db,
      f.hash,
      session.sessionId,
      { ...result, mistakes: 1, corrections: 1 },
      later(3000),
    ),
  ).rejects.toMatchObject({ code: "conflict" });
  expect((await f.db.select().from(wallets).get())?.stars).toBe(352);
  expect((await f.db.select().from(families).get())?.version).toBe(1);
});

it("rolls back every write when storing the last receipt fails, then safely retries", async () => {
  const f = await fixture();
  const session = await startGameSession(f.db, f.hash, launch, now);
  await f.client.execute(
    "CREATE TRIGGER fail_finish BEFORE UPDATE ON game_sessions WHEN NEW.status = 'completed' BEGIN SELECT RAISE(ABORT, 'test receipt failure'); END",
  );
  await expect(
    finishGameSession(f.db, f.hash, session.sessionId, result, later(2000)),
  ).rejects.toThrow();
  expect(await f.db.select().from(wallets).get()).toEqual(demo.wallet);
  expect(await f.db.select().from(brainyStates).get()).toEqual(demo.brainy);
  expect(await f.db.select().from(demoSessions).get()).toMatchObject({
    inRow: 0,
    bonusGiven: false,
  });
  expect((await f.db.select().from(families).get())?.version).toBe(0);
  expect(
    (await f.db.select().from(gameSessions).where(eq(gameSessions.id, session.sessionId)).get())
      ?.status,
  ).toBe("pending");
  await f.client.execute("DROP TRIGGER fail_finish");
  await finishGameSession(f.db, f.hash, session.sessionId, result, later(3000));
  expect((await f.db.select().from(wallets).get())?.stars).toBe(352);
});

it("handles simultaneous finishes without double rewards or lost updates", async () => {
  const f = await fixture();
  const other = await f.connect();
  const session = await startGameSession(f.db, f.hash, launch, now);
  const saves = await Promise.all([
    finishGameSession(f.db, f.hash, session.sessionId, result, later(2000)),
    finishGameSession(other.db, f.hash, session.sessionId, result, later(2000)),
  ]);
  expect(saves.map((save) => save.replayed).sort()).toEqual([false, true]);
  expect((await f.db.select().from(wallets).get())?.stars).toBe(352);
  expect((await f.db.select().from(families).get())?.version).toBe(1);
  const secondAccess = await createDemoAccess(other.db, now);
  const secondHash = demoTokenHash(secondAccess.token) as string;
  const own = await startGameSession(f.db, f.hash, launch, later(3000));
  const another = await startGameSession(other.db, secondHash, launch, later(3000));
  const distinct = await Promise.all([
    finishGameSession(f.db, f.hash, own.sessionId, result, later(5000)),
    finishGameSession(other.db, secondHash, another.sessionId, result, later(5000)),
  ]);
  expect(distinct.every((save) => !save.replayed && save.completion.bonus === 0)).toBe(true);
  expect((await f.db.select().from(wallets).get())?.stars).toBe(376);
  expect((await f.db.select().from(brainyStates).get())?.eyes).toBe(50);
  expect((await f.db.select().from(families).get())?.version).toBe(3);
  expect((await findDemoAccess(f.db, f.hash, later(5000)))?.inRow).toBe(2);
  expect((await findDemoAccess(other.db, secondHash, later(5000)))?.inRow).toBe(1);
});

it("rejects missing, foreign, expired and invalid results without granting anything", async () => {
  const f = await fixture();
  const session = await startGameSession(f.db, f.hash, launch, now);
  const stranger = await createDemoAccess(f.db, now);
  await expect(
    finishGameSession(
      f.db,
      demoTokenHash(stranger.token) as string,
      session.sessionId,
      result,
      later(2000),
    ),
  ).rejects.toMatchObject({ code: "not-found" });
  await expect(
    finishGameSession(f.db, f.hash, "missing", result, later(2000)),
  ).rejects.toMatchObject({ code: "not-found" });
  for (const invalid of [
    { ...result, rounds: 100 },
    { ...result, gameId: "continue-pattern" },
    { ...result, level: 2 },
    { ...result, stars: 999 },
    { ...result, durationMs: 9000 },
  ])
    await expect(
      finishGameSession(f.db, f.hash, session.sessionId, invalid, later(2000)),
    ).rejects.toMatchObject({ code: "invalid-input" });
  await expect(
    finishGameSession(f.db, f.hash, session.sessionId, result, later(GAME_SESSION_MS + 1)),
  ).rejects.toMatchObject({ code: "expired" });
  expect(await f.db.select().from(wallets).get()).toEqual(demo.wallet);
  expect((await f.db.select().from(families).get())?.version).toBe(0);
});

it("pays a third-game bonus once per browser session and stopping cancels pending games", async () => {
  const f = await fixture();
  for (let i = 0; i < 3; i++) {
    const session = await startGameSession(f.db, f.hash, launch, later(i * 3000));
    const saved = await finishGameSession(
      f.db,
      f.hash,
      session.sessionId,
      result,
      later(i * 3000 + 2000),
    );
    expect(saved.completion.bonus).toBe(i === 2 ? 5 : 0);
    expect(saved.completion.suggestBreak).toBe(i === 2);
  }
  const pending = await startGameSession(f.db, f.hash, launch, later(10000));
  await stopGameRun(f.db, f.hash, later(11000));
  await expect(
    finishGameSession(f.db, f.hash, pending.sessionId, result, later(12000)),
  ).rejects.toMatchObject({ code: "conflict" });
  expect(await f.db.select().from(demoSessions).get()).toMatchObject({
    inRow: 0,
    bonusGiven: true,
  });
  for (let i = 0; i < 3; i++) {
    const session = await startGameSession(f.db, f.hash, launch, later(15000 + i * 3000));
    expect(
      (await finishGameSession(f.db, f.hash, session.sessionId, result, later(17000 + i * 3000)))
        .completion.bonus,
    ).toBe(0);
  }
  expect((await f.db.select().from(wallets).get())?.stars).toBe(340 + 6 * 12 + 5);
  expect((await f.db.select().from(families).get())?.version).toBe(6);
});
