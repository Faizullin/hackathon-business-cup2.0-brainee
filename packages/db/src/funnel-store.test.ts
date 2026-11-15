import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { parseStartRequest, type QuizDraft } from "@brainee/core";
import { expect, it, onTestFinished } from "vitest";
import { resetDatabase } from "../scripts/database-tools";
import { loginParent } from "./account-store";
import { openDatabase } from "./client";
import { getDatabaseConfig } from "./config";
import { createFunnelFamily } from "./funnel-store";
import { demoTokenHash } from "./learning-store";
import { getStateSnapshot } from "./state-store";

const now = new Date("2026-11-16T12:00:00Z");
async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), "brainee-funnel-"));
  const config = getDatabaseConfig(pathToFileURL(join(dir, "test.db")).href);
  await resetDatabase(config);
  const c = await openDatabase(config);
  onTestFinished(async () => {
    c.client.close();
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  });
  return c;
}
const funnel: QuizDraft = {
  duration: "120-240",
  content: "shorts",
  finish: "switch",
  handoff: "more",
  reading: "rare",
  age: "6-7",
  name: "Leo",
  attempt: ["limits"],
  goal: ["finish"],
  minutes: "20",
  gift: "park",
  earn: true,
};
const request = (extra: Record<string, unknown> = {}) => {
  const parsed = parseStartRequest({
    funnel,
    childName: "Leo",
    plan: "annual",
    starterPack: true,
    ...extra,
  });
  if (!parsed) throw new Error("invalid request");
  return parsed;
};

it("creates the family in one step with the Starter Pack, the funnel mood and the chosen plan", async () => {
  const { db } = await fixture();
  const created = await createFunnelFamily(db, request({ email: "mum@example.com" }), now);
  const snap = await getStateSnapshot(db, demoTokenHash(created.token) as string, now);
  expect(created.credentials.email).toMatch(/^family-.+@brainee\.example$/);
  expect(created.credentials.pin).toBe("1234");
  expect(snap.child.name).toBe("Leo");
  expect(snap.progress.wallet.stars).toBe(150);
  expect(snap.showcase.owned).toContain("cape");
  expect(snap.showcase.equipped.back).toBe("cape");
  expect(snap.showcase.starterPack).toBe("pending");
  expect(snap.showcase.startPlan).toMatchObject({
    plan: "annual",
    gift: "park",
    minutes: 20,
    earn: true,
    contactEmail: "mum@example.com",
  });
  expect(snap.showcase.weekGoal).toMatchObject({ giftId: "park", target: 15 });
  expect(snap.showcase.familyPlan?.goal).toBe("ending");
  expect(snap.progress.mood).toBe(30);
  // The generated credentials really log in on a second device.
  const login = await loginParent(db, created.credentials, now);
  expect(login.child.name).toBe("Leo");
});

it("grants no pack when the timer ran out and keeps the starting 50 stars", async () => {
  const { db } = await fixture();
  const created = await createFunnelFamily(
    db,
    request({ starterPack: false, plan: "monthly" }),
    now,
  );
  const snap = await getStateSnapshot(db, demoTokenHash(created.token) as string, now);
  expect(snap.progress.wallet.stars).toBe(50);
  expect(snap.showcase.owned).not.toContain("cape");
  expect(snap.showcase.equipped.back).toBeUndefined();
  expect(snap.showcase.starterPack).toBeUndefined();
  expect(snap.showcase.startPlan?.plan).toBe("monthly");
});

it("uses a friendly default name when none was given and starts healthy answers above the floor", async () => {
  const { db } = await fixture();
  const good: QuizDraft = {
    ...funnel,
    name: undefined,
    duration: "lt30",
    content: "learn",
    finish: "yes",
    handoff: "easy",
    reading: "daily",
  };
  const created = await createFunnelFamily(db, request({ funnel: good, childName: "" }), now);
  const snap = await getStateSnapshot(db, demoTokenHash(created.token) as string, now);
  expect(snap.child.name).toBe("Your kid");
  expect(snap.progress.mood).toBe(76);
});
