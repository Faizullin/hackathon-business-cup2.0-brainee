import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, it, onTestFinished } from "vitest";
import { resetDatabase } from "../scripts/database-tools";
import { openDatabase } from "./client";
import { getDatabaseConfig } from "./config";
import { createDemoAccess, demoTokenHash } from "./learning-store";
import {
  createPairingCode,
  getSettings,
  redeemPairingCode,
  unlockWithAdultTask,
  updateSettings,
} from "./settings-store";
import { setParentUnlock } from "./showcase-store";
import { getStateSnapshot } from "./state-store";

const now = new Date("2026-11-16T04:30:00Z");
async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), "brainee-settings-"));
  const config = getDatabaseConfig(pathToFileURL(join(dir, "test.db")).href);
  await resetDatabase(config);
  const c = await openDatabase(config);
  onTestFinished(async () => {
    c.client.close();
    await rm(dir, { recursive: true, force: true });
  });
  const access = await createDemoAccess(c.db, now);
  return { ...c, config, hash: demoTokenHash(access.token) as string };
}
it("requires parent access, checks the old PIN and revokes a device without exposing cookie hashes", async () => {
  const f = await fixture();
  await expect(getSettings(f.db, f.hash, now)).rejects.toMatchObject({ code: "unauthorized" });
  expect(await unlockWithAdultTask(f.db, f.hash, "wrong", now)).toBe(false);
  expect(await unlockWithAdultTask(f.db, f.hash, "68", now)).toBe(true);
  await updateSettings(
    f.db,
    f.hash,
    { type: "child", child: { name: "Mira", birthYear: 2020, promise: 2 } },
    now,
  );
  await expect(
    updateSettings(f.db, f.hash, { type: "pin", oldPin: "9999", newPin: "2468" }, now),
  ).rejects.toMatchObject({ reason: "wrong-pin" });
  await updateSettings(f.db, f.hash, { type: "pin", oldPin: "1234", newPin: "2468" }, now);
  await setParentUnlock(f.db, f.hash, null, now);
  expect(await setParentUnlock(f.db, f.hash, "1234", now)).toBe(false);
  expect(await setParentUnlock(f.db, f.hash, "2468", now)).toBe(true);
  const data = await getSettings(f.db, f.hash, now);
  expect(data.child).toEqual({ name: "Mira", birthYear: 2020, promise: 2 });
  expect(JSON.stringify(data)).not.toContain(f.hash);
  const id = data.devices[0]?.id;
  await updateSettings(f.db, f.hash, { type: "revoke", deviceId: id }, now);
  await expect(getStateSnapshot(f.db, f.hash, now)).rejects.toMatchObject({ code: "revoked" });
});
it("applies the chosen zone immediately at midnight/Monday and preserves the prize", async () => {
  const f = await fixture();
  await setParentUnlock(f.db, f.hash, "1234", now);
  const before = await getStateSnapshot(f.db, f.hash, now);
  await updateSettings(f.db, f.hash, { type: "timezone", timeZone: "Asia/Almaty" }, now);
  const after = await getStateSnapshot(f.db, f.hash, now);
  expect(after.showcase.tasks).toEqual([]);
  expect(after.showcase.weekGoal).toEqual({ ...before.showcase.weekGoal, earned: 0 });
  expect(after.progress.wallet).toEqual(before.progress.wallet);
});
it("pairs once, replaces old codes, expires codes, and persists five-attempt lockout", async () => {
  const f = await fixture();
  await setParentUnlock(f.db, f.hash, "1234", now);
  const old = await createPairingCode(f.db, f.hash, now);
  const current = await createPairingCode(f.db, f.hash, now);
  expect(await redeemPairingCode(f.db, "device-a", old.code, now)).toEqual({ error: "wrong-code" });
  for (let i = 0; i < 5; i++)
    expect(await redeemPairingCode(f.db, "device-b", "bad", now)).toEqual({
      error: i === 4 ? "pairing-locked" : "wrong-code",
    });
  expect(await redeemPairingCode(f.db, "device-b", current.code, now)).toEqual({
    error: "pairing-locked",
  });
  const later = new Date(now.getTime() + 600001);
  const paired = await redeemPairingCode(f.db, "device-b", current.code, later);
  expect("access" in paired).toBe(true);
  if (!paired.access) throw new Error();
  const snapshot = await getStateSnapshot(
    f.db,
    demoTokenHash(paired.access.token) as string,
    later,
  );
  expect(snapshot.parentUnlocked).toBe(false);
  expect(await redeemPairingCode(f.db, "device-a", current.code, later)).toEqual({
    error: "wrong-code",
  });
  const expiring = await createPairingCode(f.db, f.hash, now);
  expect(
    await redeemPairingCode(f.db, "device-a", expiring.code, new Date(now.getTime() + 900000)),
  ).toEqual({ error: "wrong-code" });
});

it("isolates families, serializes code redemption and keeps PIN elevation at fifteen minutes", async () => {
  const f = await fixture();
  await setParentUnlock(f.db, f.hash, "1234", now);
  const { signupFromQuiz } = await import("./account-store");
  const stranger = await signupFromQuiz(
    f.db,
    {
      email: "other@example.com",
      password: "secret123",
      pin: "4321",
      childName: "Other",
      birthYear: 2020,
      answers: { hours: 1, content: 1, finish: 1, reaction: 1, reads: 1 },
      timeZone: "America/Phoenix",
    },
    now,
  );
  const strangerHash = demoTokenHash(stranger.token) as string;
  const otherSettings = await getSettings(f.db, strangerHash, now);
  expect(otherSettings.timeZone).toBe("America/Phoenix");
  await expect(
    updateSettings(f.db, f.hash, { type: "revoke", deviceId: otherSettings.devices[0]?.id }, now),
  ).rejects.toMatchObject({ code: "not-found" });
  const code = await createPairingCode(f.db, f.hash, now);
  const second = await openDatabase(f.config);
  onTestFinished(() => second.client.close());
  const results = await Promise.all([
    redeemPairingCode(f.db, "one", code.code, now),
    redeemPairingCode(second.db, "two", code.code, now),
  ]);
  expect(results.filter((result) => result.access)).toHaveLength(1);
  await expect(getSettings(f.db, f.hash, new Date(now.getTime() + 900000))).rejects.toMatchObject({
    code: "unauthorized",
  });
});

it("validates funnel answers and the exact age before converting the quiz start", async () => {
  const f = await fixture();
  const { signupFromQuiz } = await import("./account-store");
  const { funnelQuizAnswers, quizStart } = await import("@brainee/core");
  const funnel = {
    goal: "ending",
    age: "6-7",
    duration: "one",
    content: "kids",
    finish: "switch",
    handoff: "bargain",
    reading: "together",
    attempt: "timer",
    moment: "afternoon",
  };
  const input = {
    email: "funnel@example.com",
    password: "secret123",
    pin: "2468",
    childName: "Alex",
    birthYear: 2020,
    funnel,
  };
  for (const invalid of [
    { ...input, funnel: { ...funnel, age: "outside" } },
    { ...input, birthYear: 2022 },
    { ...input, funnel: { ...funnel, moment: "invalid" } },
  ])
    await expect(signupFromQuiz(f.db, invalid, now)).rejects.toMatchObject({
      reason: "invalid-input",
    });
  const access = await signupFromQuiz(f.db, input, now);
  const state = await getStateSnapshot(f.db, demoTokenHash(access.token) as string, now);
  expect(state.progress.stats).toEqual(quizStart(funnelQuizAnswers(funnel)).stats);
  expect(state.showcase.familyPlan).toEqual(funnel);
  expect(state.progress.wallet).toEqual({ stars: 50, suns: 0 });
});
