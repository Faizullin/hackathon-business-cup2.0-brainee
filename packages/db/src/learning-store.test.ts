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
import { getStateSnapshot } from "./state-store";

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

it("pays a third-game bonus once per day and stopping cancels pending games", async () => {
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
  expect((await f.db.select().from(families).get())?.version).toBe(7);
});

it("shares the daily bonus across concurrent devices and allows it again after local midnight", async () => {
  const f = await fixture();
  const other = await f.connect();
  const second = await createDemoAccess(other.db, now);
  const secondHash = demoTokenHash(second.token) as string;
  const play = async (db: typeof f.db, hash: string, at: Date) => {
    const session = await startGameSession(db, hash, launch, at);
    return finishGameSession(db, hash, session.sessionId, result, new Date(at.getTime() + 2000));
  };
  for (const hash of [f.hash, secondHash]) {
    await play(f.db, hash, later(0));
    await play(f.db, hash, later(3000));
  }
  const finishes = await Promise.all([
    play(f.db, f.hash, later(6000)),
    play(other.db, secondHash, later(6000)),
  ]);
  expect(finishes.map((save) => save.completion.bonus).sort()).toEqual([0, 5]);
  const fresh = await createDemoAccess(f.db, later(10000));
  const freshHash = demoTokenHash(fresh.token) as string;
  expect((await getStateSnapshot(f.db, freshHash, later(10000))).progress.streak.bonusGiven).toBe(
    true,
  );
  for (let i = 0; i < 3; i++)
    expect((await play(f.db, freshHash, later(15000 + i * 3000))).completion.bonus).toBe(0);
  const tomorrow = new Date("2026-11-14T19:00:00Z");
  const reset = await getStateSnapshot(f.db, f.hash, tomorrow);
  expect(reset.progress.streak).toEqual({ inRow: 0, bonusGiven: false });
  expect((await getStateSnapshot(other.db, secondHash, tomorrow)).progress.streak).toEqual(
    reset.progress.streak,
  );
  for (let i = 0; i < 3; i++) {
    expect(
      (await play(f.db, f.hash, new Date(tomorrow.getTime() + i * 3000))).completion.bonus,
    ).toBe(i === 2 ? 5 : 0);
  }
});

it("counts an overnight finish in the new day without replaying yesterday's streak or reward", async () => {
  const f = await fixture();
  for (let i = 0; i < 2; i++) {
    const started = await startGameSession(f.db, f.hash, launch, later(i * 3000));
    await finishGameSession(f.db, f.hash, started.sessionId, result, later(i * 3000 + 2000));
  }
  const started = await startGameSession(f.db, f.hash, launch, new Date("2026-11-14T18:59:59Z"));
  const saved = await finishGameSession(
    f.db,
    f.hash,
    started.sessionId,
    result,
    new Date("2026-11-14T19:00:01Z"),
  );
  expect(saved.completion).toMatchObject({
    bonus: 0,
    after: { streak: { inRow: 1, bonusGiven: false } },
  });
  const beforeReplay = await getStateSnapshot(f.db, f.hash, new Date("2026-11-15T19:00:01Z"));
  expect(
    (
      await finishGameSession(
        f.db,
        f.hash,
        started.sessionId,
        result,
        new Date("2026-11-15T19:00:02Z"),
      )
    ).replayed,
  ).toBe(true);
  expect((await getStateSnapshot(f.db, f.hash, new Date("2026-11-15T19:00:02Z"))).progress).toEqual(
    beforeReplay.progress,
  );
});
