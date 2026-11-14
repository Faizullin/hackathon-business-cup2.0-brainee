import { expect, it } from "vitest";
import { advanceCalendar, calendarKeys, TASK_HISTORY_LIMIT } from "./calendar";
import type { Showcase } from "./showcase";

const initial: Pick<Showcase, "calendar" | "taskHistory" | "tasks" | "weekGoal"> = {
  calendar: { timeZone: "Asia/Almaty", day: "2026-11-15", week: "2026-11-09", bonusGiven: true },
  weekGoal: { earned: 8, target: 10, giftId: "cinema", due: "Sunday" },
  tasks: ["todo", "check", "done"].map((status, i) => ({
    id: String(i),
    title: "Task",
    place: "real",
    skill: "Reading",
    reward: 2,
    status: status as "todo" | "check" | "done",
  })),
};

it("uses family midnight and Monday, including DST and year boundaries", () => {
  expect(calendarKeys(new Date("2026-11-15T18:59:59Z"), "Asia/Almaty")).toEqual({
    day: "2026-11-15",
    week: "2026-11-09",
  });
  expect(calendarKeys(new Date("2026-11-15T19:00:00Z"), "Asia/Almaty")).toEqual({
    day: "2026-11-16",
    week: "2026-11-16",
  });
  expect(calendarKeys(new Date("2027-01-01T00:00:00Z"), "UTC")).toEqual({
    day: "2027-01-01",
    week: "2026-12-28",
  });
  expect(calendarKeys(new Date("2026-03-08T04:59:59Z"), "America/New_York").day).toBe("2026-03-07");
  expect(calendarKeys(new Date("2026-03-09T04:00:00Z"), "America/New_York").day).toBe("2026-03-09");
});

it("archives daily tasks, resets the bonus and only the earned part of a Monday goal", () => {
  const result = advanceCalendar(initial, new Date("2026-11-15T19:00:00Z"));
  expect(result).toMatchObject({
    changed: true,
    dayChanged: true,
    showcase: {
      tasks: [],
      calendar: { bonusGiven: false, day: "2026-11-16" },
      weekGoal: { ...initial.weekGoal, earned: 0 },
    },
  });
  expect(result.showcase.taskHistory?.map((task) => [task.status, task.day])).toEqual([
    ["expired", "2026-11-15"],
    ["expired", "2026-11-15"],
    ["done", "2026-11-15"],
  ]);
  expect(initial.tasks).toHaveLength(3);
  expect(initial.calendar?.bonusGiven).toBe(true);
  expect(advanceCalendar(result.showcase, new Date("2026-11-16T12:00:00Z")).changed).toBe(false);
  expect(advanceCalendar(result.showcase, new Date("2026-11-15T12:00:00Z")).changed).toBe(false);
});

it("keeps weekly earnings on other days and bounds retained task history", () => {
  const monday = advanceCalendar(initial, new Date("2026-11-16T12:00:00Z")).showcase;
  monday.weekGoal.earned = 3;
  monday.tasks = initial.tasks;
  monday.taskHistory = Array.from({ length: TASK_HISTORY_LIMIT }, (_, i) => ({
    ...initial.tasks[0],
    id: `old-${i}`,
    day: "2026-11-01",
    status: "expired",
  })) as NonNullable<Showcase["taskHistory"]>;
  const next = advanceCalendar(monday, new Date("2026-11-17T12:00:00Z")).showcase;
  expect(next.weekGoal.earned).toBe(3);
  expect(next.taskHistory).toHaveLength(TASK_HISTORY_LIMIT);
  expect(next.taskHistory?.[0]?.id).toBe("0");
});

it("initialises undated showcase data without deleting seeded content", () => {
  const undated = { ...initial, calendar: undefined };
  const result = advanceCalendar(undated, new Date("2026-11-20T12:00:00Z"));
  expect(result.dayChanged).toBe(false);
  expect(result.showcase.tasks).toEqual(initial.tasks);
  expect(result.showcase.weekGoal.earned).toBe(8);
});
