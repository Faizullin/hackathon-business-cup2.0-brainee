import type { Showcase, Task } from "./showcase";

// MVP family default; Settings can later persist a different IANA zone here.
export const DEFAULT_TIME_ZONE = "America/New_York";
export const TASK_HISTORY_LIMIT = 100;
export type FamilyCalendar = { timeZone: string; day: string; week: string; bonusGiven: boolean };
export type ArchivedTask = Omit<Task, "status"> & { day: string; status: "done" | "expired" };

/** Stable local date and Monday key, independent of the server's own timezone. */
export function calendarKeys(now: Date, timeZone = DEFAULT_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (name: string) => parts.find((p) => p.type === name)?.value;
  const day = `${part("year")}-${part("month")}-${part("day")}`;
  const monday = new Date(`${day}T00:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return { day, week: monday.toISOString().slice(0, 10) };
}

/** Lazy rollover: preserve balances, purchases and goal settings; archive yesterday's tasks. */
export function advanceCalendar<
  T extends Pick<Showcase, "calendar" | "tasks" | "taskHistory" | "weekGoal">,
>(showcase: T, now: Date) {
  const previous = showcase.calendar;
  const timeZone = previous?.timeZone ?? DEFAULT_TIME_ZONE;
  const keys = calendarKeys(now, timeZone);
  // Never roll backwards if a delayed request carries an older server timestamp.
  const dayChanged = !!previous && keys.day > previous.day;
  const weekChanged = !!previous && keys.week > previous.week;
  if (previous && !dayChanged && !weekChanged)
    return { showcase, changed: false, dayChanged: false };
  const next = structuredClone(showcase);
  next.calendar = {
    timeZone,
    ...keys,
    bonusGiven: dayChanged ? false : (previous?.bonusGiven ?? false),
  };
  if (dayChanged) {
    const archived: ArchivedTask[] = next.tasks.map((task) => ({
      ...task,
      day: previous.day,
      status: task.status === "done" ? "done" : "expired",
    }));
    next.taskHistory = [...archived, ...(next.taskHistory ?? [])].slice(0, TASK_HISTORY_LIMIT);
    next.tasks = [];
  }
  if (weekChanged) next.weekGoal.earned = 0;
  return { showcase: next, changed: true, dayChanged };
}
