import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { eq } from "drizzle-orm";
import { expect, it, onTestFinished } from "vitest";
import {
  brainyStates,
  children,
  demoSessions,
  families,
  gameSessions,
  games,
  parents,
  wallets,
} from "../schema";
import { resetDatabase, runDrizzle, seedDatabase } from "../scripts/database-tools";
import { openDatabase } from "./client";
import { getDatabaseConfig } from "./config";
import { demo } from "./seed";

async function temporaryDatabase() {
  const directory = await mkdtemp(join(tmpdir(), "brainee-db-"));
  const config = getDatabaseConfig(pathToFileURL(join(directory, "test.db")).href);
  let connection: Awaited<ReturnType<typeof openDatabase>> | undefined;
  onTestFinished(async () => {
    if (connection && !connection.client.closed) connection.client.close();
    await rm(directory, { recursive: true, force: true });
  });
  return {
    config,
    async seeded() {
      await resetDatabase(config);
      connection = await openDatabase(config);
      return connection;
    },
  };
}

it("creates the schema and seed that another connection can read", async () => {
  const fixture = await temporaryDatabase();
  const { db } = await fixture.seeded();
  expect(await db.select().from(families)).toEqual([demo.family]);
  expect(await db.select().from(children)).toEqual([demo.child]);
  expect(await db.select().from(parents)).toEqual([demo.parent]);
  expect(demo.parent.pinHash).toMatch(/^scrypt\$/);
  expect(await db.select().from(brainyStates)).toEqual([demo.brainy]);
  expect(await db.select().from(games)).toEqual([...demo.games]);
  expect(await db.select().from(gameSessions)).toEqual(expect.arrayContaining([demo.history]));
  expect(await db.select().from(gameSessions)).toHaveLength(10);
  const reopened = await openDatabase(fixture.config);
  try {
    expect(await reopened.db.select().from(wallets)).toEqual([demo.wallet]);
  } finally {
    reopened.client.close();
  }
});

it("refreshes only the shared demo family", async () => {
  const fixture = await temporaryDatabase();
  const { db } = await fixture.seeded();
  await db.insert(families).values({ ...demo.family, id: "other-family" });
  await db.insert(children).values({ ...demo.child, id: "other-child", familyId: "other-family" });
  await db.update(children).set({ name: "Renamed" }).where(eq(children.id, demo.child.id));
  await db.update(wallets).set({ stars: 1 }).where(eq(wallets.childId, demo.child.id));
  await seedDatabase(fixture.config, true);
  expect(await db.select().from(children).where(eq(children.id, demo.child.id))).toEqual([
    demo.child,
  ]);
  expect(await db.select().from(wallets)).toEqual([demo.wallet]);
  expect(await db.select().from(children)).toHaveLength(2);
  expect(await db.select().from(gameSessions)).toHaveLength(10);
});

it("allows more than one child in a family", async () => {
  const fixture = await temporaryDatabase();
  const { db } = await fixture.seeded();
  await db.insert(children).values({ ...demo.child, id: "second-child", name: "Noah" });
  expect(await db.select().from(children)).toHaveLength(2);
});

it("enforces parent references and cascading child/wallet deletion", async () => {
  const fixture = await temporaryDatabase();
  const { db, client } = await fixture.seeded();
  const orphanWrites = await Promise.allSettled(
    ["orphan-a", "orphan-b"].map((id) =>
      client.execute({
        sql: "INSERT INTO children (id, family_id, name, birth_year) VALUES (?, ?, ?, ?)",
        args: [id, "missing-family", "Sasha", 2020],
      }),
    ),
  );
  for (const attempt of orphanWrites) {
    expect(attempt.status).toBe("rejected");
    if (attempt.status === "rejected") expect(String(attempt.reason)).toMatch(/FOREIGN KEY/);
  }
  await db.delete(families).where(eq(families.id, demo.family.id));
  expect(await db.select().from(children)).toEqual([]);
  expect(await db.select().from(wallets)).toEqual([]);
});

it("rejects negative and fractional currency balances", async () => {
  const fixture = await temporaryDatabase();
  const { db } = await fixture.seeded();
  for (const values of [{ stars: -1 }, { suns: -1 }, { stars: 1.5 }, { suns: 1.5 }]) {
    await expect(
      db.update(wallets).set(values).where(eq(wallets.childId, demo.child.id)),
    ).rejects.toThrow();
  }
  expect(await db.select().from(wallets)).toEqual([demo.wallet]);
});

it("repeated seed preserves existing balances and creates no duplicates", async () => {
  const fixture = await temporaryDatabase();
  const { db } = await fixture.seeded();
  await db.update(wallets).set({ stars: 123 }).where(eq(wallets.childId, demo.child.id));
  await db
    .update(brainyStates)
    .set({ eyes: 99.5, mood: 55 })
    .where(eq(brainyStates.childId, demo.child.id));
  await db.update(families).set({ version: 8 }).where(eq(families.id, demo.family.id));
  await db.update(games).set({ enabled: false }).where(eq(games.id, "odd-one-out"));
  await seedDatabase(fixture.config);
  await seedDatabase(fixture.config);
  expect(await db.select().from(families)).toHaveLength(1);
  expect(await db.select().from(children)).toHaveLength(1);
  expect(await db.select().from(wallets)).toEqual([{ ...demo.wallet, stars: 123 }]);
  expect((await db.select().from(brainyStates).get())?.eyes).toBe(99.5);
  expect((await db.select().from(families).get())?.version).toBe(8);
  expect((await db.select().from(games).where(eq(games.id, "odd-one-out")).get())?.enabled).toBe(
    false,
  );
  expect(await db.select().from(gameSessions)).toHaveLength(10);
});

it("constrains Brainy values, family versions, catalog values and history references", async () => {
  const fixture = await temporaryDatabase();
  const { db } = await fixture.seeded();
  for (const invalid of [{ brain: -1 }, { resp: 101 }, { mood: 101 }])
    await expect(db.update(brainyStates).set(invalid)).rejects.toThrow();
  for (const version of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1])
    await expect(db.update(families).set({ version })).rejects.toThrow();
  await expect(db.update(games).set({ levels: 0 })).rejects.toThrow();
  await expect(db.update(gameSessions).set({ childId: "missing" })).rejects.toThrow();
  await expect(db.update(gameSessions).set({ completion: null })).rejects.toThrow();
  await db.delete(families).where(eq(families.id, demo.family.id));
  expect(await db.select().from(parents)).toEqual([]);
  expect(await db.select().from(brainyStates)).toEqual([]);
  expect(await db.select().from(gameSessions)).toEqual([]);
});

it("rolls back the whole transaction when a wallet write fails", async () => {
  const fixture = await temporaryDatabase();
  const { db } = await fixture.seeded();
  await expect(
    db.transaction(async (transaction) => {
      await transaction.insert(children).values({ ...demo.child, id: "rollback-child" });
      await transaction.insert(wallets).values({ childId: "rollback-child", stars: -1, suns: 0 });
    }),
  ).rejects.toThrow();
  expect(await db.select().from(children)).toEqual([demo.child]);
});

it("push preserves data; reset removes stale schema and restores the demo", async () => {
  const fixture = await temporaryDatabase();
  const { db, client } = await fixture.seeded();
  await db.update(wallets).set({ stars: 999 }).where(eq(wallets.childId, demo.child.id));
  await db.insert(demoSessions).values({
    tokenHash: "push-test-session",
    childId: demo.child.id,
    createdAt: new Date("2026-11-14"),
    expiresAt: new Date("2026-11-15"),
  });
  await db.insert(gameSessions).values({
    id: "push-test-game",
    childId: demo.child.id,
    demoSessionHash: "push-test-session",
    gameId: "odd-one-out",
    level: 1,
    seed: 0,
    startedAt: new Date("2026-11-14"),
  });
  runDrizzle(fixture.config);
  expect(await db.select().from(wallets)).toEqual([{ ...demo.wallet, stars: 999 }]);
  expect(await db.select().from(brainyStates)).toEqual([demo.brainy]);
  expect(await db.select().from(parents)).toEqual([demo.parent]);
  expect(await db.select().from(demoSessions)).toHaveLength(1);
  expect(
    await db.select().from(gameSessions).where(eq(gameSessions.id, "push-test-game")).get(),
  ).toMatchObject({ demoSessionHash: "push-test-session", status: "pending" });
  expect(
    await db.select().from(gameSessions).where(eq(gameSessions.id, demo.history.id)).get(),
  ).toEqual(demo.history);
  await client.execute("CREATE TABLE stale_demo (id TEXT)");
  client.close();
  await resetDatabase(fixture.config);
  const reopened = await openDatabase(fixture.config);
  try {
    expect(await reopened.db.select().from(wallets)).toEqual([demo.wallet]);
    const stale = await reopened.client.execute(
      "SELECT name FROM sqlite_master WHERE name = 'stale_demo'",
    );
    expect(stale.rows).toEqual([]);
  } finally {
    reopened.client.close();
  }
});

it("does not overwrite a non-SQLite file during reset", async () => {
  const { config } = await temporaryDatabase();
  await writeFile(config.path, "keep this file");
  await expect(resetDatabase(config)).rejects.toThrow(/not a SQLite database/);
  expect(await readFile(config.path, "utf8")).toBe("keep this file");
});
