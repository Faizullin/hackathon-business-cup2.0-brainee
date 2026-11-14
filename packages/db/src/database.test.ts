import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { eq } from "drizzle-orm";
import { expect, it, onTestFinished } from "vitest";
import { children, families, wallets } from "../schema";
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
  const reopened = await openDatabase(fixture.config);
  try {
    expect(await reopened.db.select().from(wallets)).toEqual([demo.wallet]);
  } finally {
    reopened.client.close();
  }
});

it("allows more than one child in a family", async () => {
  const fixture = await temporaryDatabase();
  const { db } = await fixture.seeded();
  await db.insert(children).values({ ...demo.child, id: "second-child", name: "Миша" });
  expect(await db.select().from(children)).toHaveLength(2);
});

it("enforces parent references and cascading child/wallet deletion", async () => {
  const fixture = await temporaryDatabase();
  const { db, client } = await fixture.seeded();
  await expect(
    client.execute({
      sql: "INSERT INTO children (id, family_id, name, birth_year) VALUES (?, ?, ?, ?)",
      args: ["orphan", "missing-family", "Саша", 2020],
    }),
  ).rejects.toThrow(/FOREIGN KEY/);
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
  await seedDatabase(fixture.config);
  await seedDatabase(fixture.config);
  expect(await db.select().from(families)).toHaveLength(1);
  expect(await db.select().from(children)).toHaveLength(1);
  expect(await db.select().from(wallets)).toEqual([{ ...demo.wallet, stars: 123 }]);
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
  runDrizzle(fixture.config);
  expect(await db.select().from(wallets)).toEqual([{ ...demo.wallet, stars: 999 }]);
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
