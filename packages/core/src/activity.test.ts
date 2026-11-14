import { expect, it } from "vitest";
import {
  type ActivitySession,
  activitySummary,
  completeAppTasks,
  EARNED_THRESHOLDS,
  earnedRewards,
  rewardProgress,
  unlockEarned,
} from "./activity";
import type { Showcase } from "./showcase";

const now = new Date("2026-11-16T12:00:00Z");
const showcase = {
  calendar: { timeZone: "America/New_York" },
  entryLog: { took: 3, other: 1 },
  science: [],
  tasks: [],
  earned: [],
  feed: [],
} as unknown as Showcase;
const stats = { brain: 20, eyes: 20, mouth: 20, arms: 20, legs: 20, resp: 69 };
const session = (i: number, finished = true, recommended = true): ActivitySession => ({
  gameId: "odd-one-out",
  startedAt: now.getTime() - i * 86400000 - 120000,
  finishedAt: finished ? now.getTime() - i * 86400000 : null,
  durationMs: finished ? 120000 : null,
  recommended,
});
it("uses local Monday, actual durations, advice entries and a current day streak", () => {
  const data = {
    ...showcase,
    science: [{ minutes: 20, completedAt: now.toISOString() }],
  } as Showcase;
  const a = activitySummary([session(0), session(1), session(2)], data, now);
  expect(a.learning).toEqual([2, 0, 0, 0, 0, 0, 0]);
  expect(a.science).toEqual([20, 0, 0, 0, 0, 0, 0]);
  expect(a.streakDays).toBe(3);
  expect(a.takesRecommendation).toBe(75);
  expect(a.focusMinutes).toBe(2);
  expect(activitySummary([session(2)], data, now).streakDays).toBe(0);
});
it("completes all app tasks once without paying suns or touching real tasks", () => {
  const s = {
    ...showcase,
    tasks: [
      { id: "a", place: "app", reward: 15, status: "todo" },
      { id: "b", place: "real", reward: 2, status: "check" },
    ],
  } as Showcase;
  const first = completeAppTasks(s, { stars: 50, suns: 3 }, now);
  expect(first.wallet).toEqual({ stars: 65, suns: 3 });
  expect(first.showcase.tasks[1]?.status).toBe("check");
  expect(completeAppTasks(first.showcase, first.wallet, now).stars).toBe(0);
  expect(s.tasks[0]?.status).toBe("todo");
});
it("unlocks badge/backpack/garden exactly at their named thresholds and never revokes them", () => {
  const a = activitySummary(
    Array.from({ length: EARNED_THRESHOLDS.explorerGames - 1 }, (_, i) => session(i % 6)),
    showcase,
    now,
  );
  expect(earnedRewards(stats, a)).not.toContain("explorerBadge");
  expect(rewardProgress(stats, a).explorerBadge.value).toBe(9);
  const full = { ...a, completed: 10, streakDays: 7 };
  expect(earnedRewards({ ...stats, resp: 70 }, full)).toEqual(
    expect.arrayContaining(["captainBackpack", "explorerBadge", "ownGarden"]),
  );
  const gained = unlockEarned(showcase, { ...stats, resp: 70 }, full, now);
  expect(unlockEarned(gained, stats, a, now).earned).toEqual(gained.earned);
  expect(unlockEarned(gained, stats, a, now).feed).toEqual(gained.feed);
});
it("cape checks five completions in the last ten recommended starts, excluding older wins", () => {
  const recent = Array.from({ length: 10 }, (_, i) => session(i, i < 4));
  const older = Array.from({ length: 20 }, (_, i) => session(i + 10));
  expect(earnedRewards(stats, activitySummary([...recent, ...older], showcase, now))).not.toContain(
    "heroCape",
  );
  recent[4] = session(4);
  expect(earnedRewards(stats, activitySummary([...older, ...recent], showcase, now))).toContain(
    "heroCape",
  );
  expect(earnedRewards(stats, activitySummary(recent.slice(0, 9), showcase, now))).not.toContain(
    "heroCape",
  );
});

it("Brainy's suggestion never sends a weak motor stat to a motor game", async () => {
  const { learningPracticeGame } = await import("./learning");
  const games = [
    { id: "motor", kind: "dev" as const, skills: { main: "motor" as const } },
    { id: "logic", kind: "dev" as const, skills: { main: "logic" as const } },
  ];
  expect(learningPracticeGame({ ...stats, arms: 0 }, games)?.id).toBe("logic");
});
