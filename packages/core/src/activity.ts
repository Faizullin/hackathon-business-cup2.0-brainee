import { calendarKeys, DEFAULT_TIME_ZONE } from "./calendar";
import { addFeed, type Showcase } from "./showcase";
import type { BrainyStats, Wallet } from "./types";

export type ActivitySession = {
  gameId: string;
  startedAt: number;
  finishedAt: number | null;
  durationMs: number | null;
  recommended: boolean;
  starsEarned?: number | null;
};
const DAY = 86400000;
export const EARNED_THRESHOLDS = {
  captainResponsibility: 70,
  explorerGames: 10,
  gardenStreak: 7,
  heroWindow: 10,
  heroCompletions: 5,
} as const;
export function activitySummary(
  sessions: readonly ActivitySession[],
  showcase: Showcase,
  now: Date,
) {
  const zone = showcase.calendar?.timeZone ?? DEFAULT_TIME_ZONE;
  const { day, week } = calendarKeys(now, zone);
  const completed = sessions.filter((s) => s.finishedAt !== null && s.finishedAt <= now.getTime());
  const days = new Set(
    completed.map((s) => calendarKeys(new Date(s.finishedAt as number), zone).day),
  );
  let streak = 0;
  let cursor = Date.parse(day);
  if (!days.has(day)) cursor -= DAY;
  while (days.has(new Date(cursor).toISOString().slice(0, 10))) {
    streak++;
    cursor -= DAY;
  }
  const learning = Array<number>(7).fill(0),
    science = Array<number>(7).fill(0);
  const index = (at: number) =>
    Math.round((Date.parse(calendarKeys(new Date(at), zone).day) - Date.parse(week)) / DAY);
  for (const s of completed) {
    const i = index(s.finishedAt as number);
    if (i >= 0 && i < 7) learning[i] = (learning[i] ?? 0) + (s.durationMs ?? 0) / 60000;
  }
  for (const v of showcase.science) {
    if (!v.completedAt) continue;
    const i = index(Date.parse(v.completedAt));
    if (i >= 0 && i < 7) science[i] = (science[i] ?? 0) + v.minutes;
  }
  const recommended = sessions.filter((s) => s.recommended);
  const lastRecommended = [...recommended]
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, EARNED_THRESHOLDS.heroWindow);
  const entries = showcase.entryLog.took + showcase.entryLog.other;
  return {
    learningStarsToday: completed
      .filter((s) => calendarKeys(new Date(s.finishedAt as number), zone).day === day)
      .reduce((sum, s) => sum + (s.starsEarned ?? 0), 0),
    learning,
    science,
    streakDays: streak,
    completed: completed.length,
    focusMinutes: completed.length
      ? Math.round(
          completed.reduce((n, s) => n + (s.durationMs ?? 0), 0) / completed.length / 60000,
        )
      : 0,
    takesRecommendation: entries ? Math.round((showcase.entryLog.took / entries) * 100) : 0,
    entries,
    took: showcase.entryLog.took,
    recommendedStarted: recommended.length,
    heroStarted: lastRecommended.length,
    heroFinished: lastRecommended.filter((s) => s.finishedAt !== null).length,
    recommendedFinished: recommended.filter((s) => s.finishedAt !== null).length,
  };
}
export type ActivitySummary = ReturnType<typeof activitySummary>;

/** All assigned in-app tasks complete on a learning finish; retries see done tasks. */
export function completeAppTasks(showcase: Showcase, wallet: Wallet, now: Date) {
  const next = structuredClone(showcase);
  let stars = 0;
  for (const task of next.tasks)
    if (task.place === "app" && task.status === "todo") {
      task.status = "done";
      stars += task.reward;
      addFeed(next, {
        at: now.toISOString(),
        kind: "app-task",
        title: task.title,
        amount: task.reward,
      });
    }
  return { showcase: next, wallet: { ...wallet, stars: wallet.stars + stars }, stars };
}
export function rewardProgress(stats: BrainyStats, activity: ActivitySummary) {
  const t = EARNED_THRESHOLDS;
  return {
    captainBackpack: { value: stats.resp, target: t.captainResponsibility },
    explorerBadge: { value: activity.completed, target: t.explorerGames },
    ownGarden: { value: activity.streakDays, target: t.gardenStreak },
    heroCape: {
      value: activity.heroFinished,
      target: t.heroCompletions,
      starts: activity.heroStarted,
      window: t.heroWindow,
    },
  };
}
export function earnedRewards(stats: BrainyStats, activity: ActivitySummary) {
  return Object.entries(rewardProgress(stats, activity))
    .filter(
      ([id, p]) =>
        p.value >= p.target &&
        (id !== "heroCape" || activity.heroStarted >= EARNED_THRESHOLDS.heroWindow),
    )
    .map(([id]) => id);
}
export function unlockEarned(
  showcase: Showcase,
  stats: BrainyStats,
  activity: ActivitySummary,
  now: Date,
) {
  const next = structuredClone(showcase);
  for (const id of earnedRewards(stats, activity))
    if (!next.earned.includes(id)) {
      next.earned.push(id);
      addFeed(next, { at: now.toISOString(), kind: "earned", title: id });
    }
  return next;
}
