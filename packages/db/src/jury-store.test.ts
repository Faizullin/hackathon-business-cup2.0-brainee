import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, it, onTestFinished } from "vitest";
import { resetDatabase } from "../scripts/database-tools";
import { openDatabase } from "./client";
import { getDatabaseConfig } from "./config";
import { createJuryFamily } from "./jury-store";
import { demoTokenHash, finishGameSession, startGameSession } from "./learning-store";
import { updateFunPlay } from "./leisure-store";
import { getSettings } from "./settings-store";
import { applyShowcase } from "./showcase-store";
import { getStateSnapshot } from "./state-store";

const now = new Date("2026-11-16T12:00:00Z");
async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), "brainee-jury-"));
  const config = getDatabaseConfig(pathToFileURL(join(dir, "test.db")).href);
  await resetDatabase(config);
  const c = await openDatabase(config);
  onTestFinished(async () => {
    c.client.close();
    await rm(dir, { recursive: true, force: true });
  });
  return c;
}
it("jury families are isolated, have nine real finishes, and game ten pays an app task once and unlocks the badge", async () => {
  const { db } = await fixture();
  const a = await createJuryFamily(db, now),
    b = await createJuryFamily(db, now);
  const ah = demoTokenHash(a.token) as string,
    bh = demoTokenHash(b.token) as string;
  const before = await getStateSnapshot(db, ah, now),
    other = await getStateSnapshot(db, bh, now);
  expect(before.child.id).not.toBe(other.child.id);
  expect(before.activity?.completed).toBe(9);
  expect(before.showcase.earned).not.toContain("explorerBadge");
  expect((await getSettings(db, ah, now)).jury).toBe(true);
  expect(before.showcase.requests.some((r) => !r.delivered)).toBe(true);
  const session = await startGameSession(
    db,
    ah,
    { gameId: "odd-one-out", level: 1, recommended: true },
    now,
  );
  const result = {
    gameId: "odd-one-out",
    level: 1,
    rounds: 4,
    mistakes: 0,
    corrections: 0,
    durationMs: 0,
  };
  await finishGameSession(db, ah, session.sessionId, result, now);
  const after = await getStateSnapshot(db, ah, now);
  expect(after.progress.wallet.stars).toBe(before.progress.wallet.stars + 12 + 15);
  expect(after.showcase.tasks.find((t) => t.id === "jury-app")?.status).toBe("done");
  expect(after.showcase.earned).toContain("explorerBadge");
  expect(after.showcase.feed.some((e) => e.kind === "earned")).toBe(true);
  await finishGameSession(db, ah, session.sessionId, result, now);
  expect((await getStateSnapshot(db, ah, now)).progress.wallet).toEqual(after.progress.wallet);
  expect((await getStateSnapshot(db, bh, now)).progress.wallet).toEqual(other.progress.wallet);
});
it("jury pruning deletes only expired jury families, with dependent rows", async () => {
  const { db, client } = await fixture();
  const old = await createJuryFamily(db, now),
    token = demoTokenHash(old.token) as string;
  await client.execute({
    sql: "UPDATE families SET created_at=? WHERE plan='jury'",
    args: [now.getTime() - 8 * 86400000],
  });
  await createJuryFamily(db, now);
  await expect(getStateSnapshot(db, token, now)).rejects.toMatchObject({ code: "unauthorized" });
  expect(
    (await client.execute("SELECT id FROM families WHERE id='demo-family'")).rows,
  ).toHaveLength(1);
});
it("fun time adds on purchase, stays idle without ticks, rejects fabricated time and deduplicates ticks", async () => {
  const { db } = await fixture();
  const a = await createJuryFamily(db, now),
    token = demoTokenHash(a.token) as string;
  for (let i = 0; i < 2; i++)
    await applyShowcase(db, token, { type: "unlock-fun", gameId: "snake", mode: "timed" }, now);
  const started = await updateFunPlay(db, token, { type: "start", gameId: "snake" }, now);
  expect(started.remainingSeconds).toBe(1200);
  const tick = { type: "tick", gameId: "snake", id: started.id, sequence: 1, seconds: 5 };
  const later = new Date(now.getTime() + 5000);
  expect((await updateFunPlay(db, token, tick, later)).remainingSeconds).toBe(1195);
  expect((await updateFunPlay(db, token, tick, later)).remainingSeconds).toBe(1195);
  await expect(
    updateFunPlay(db, token, { ...tick, sequence: 2, seconds: 600 }, later),
  ).rejects.toMatchObject({ code: "invalid-input" });
  const idle = await getStateSnapshot(db, token, new Date(now.getTime() + 600000));
  expect(idle.showcase.fun.find((g) => g.id === "snake")?.remainingSeconds).toBe(1195);
});
