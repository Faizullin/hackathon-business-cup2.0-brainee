import { expect, it } from "vitest";
import {
  parentEnergyBand,
  parentFeedDays,
  parentWalletBreakdown,
  parentWeekReport,
} from "./parent-report";
import type { FeedItem, Task } from "./showcase";

const task = (title: string, place: Task["place"], reward: number): Task => ({
  id: title,
  title,
  place,
  reward,
  skill: "attention",
  status: "done",
});
const event = (kind: FeedItem["kind"], amount: number, title?: string): FeedItem => ({
  kind,
  amount,
  title,
  at: "2026-11-16T12:00:00Z",
});

it("reconciles recent earned, spent and exchanged currencies without inventing an opening balance", () => {
  const result = parentWalletBreakdown(
    { stars: 71, suns: 8 },
    {
      tasks: [task("Tidy books", "real", 3), task("Practice", "app", 5)],
      feed: [
        event("game", 12),
        event("app-task", 4),
        event("video", 15),
        event("task-confirmed", 3, "Tidy books"),
        event("task-confirmed", 5, "Practice"),
        event("exchange", 2),
        event("accessory", 20),
        event("fun", 10),
        event("gift-bought", 4),
        event("gift-delivered", 4),
      ],
    },
  );
  expect(result.stars).toEqual({ other: 45, earned: 56, spent: 30, balance: 71 });
  expect(result.suns).toEqual({ other: 11, earned: 3, spent: 6, balance: 8 });
  for (const value of Object.values(result))
    expect(value.other + value.earned - value.spent).toBe(value.balance);
});

it("keeps missing or ambiguous task currency in other activity and permits a negative residual", () => {
  const result = parentWalletBreakdown(
    { stars: 5, suns: 0 },
    {
      tasks: [task("Practice", "app", 2), task("Practice", "real", 2)],
      feed: [
        event("game", 12),
        event("task-confirmed", 2, "Practice"),
        event("task-confirmed", 9, "Removed task"),
        event("game", -10),
      ],
    },
  );
  expect(result.stars).toEqual({ other: -7, earned: 12, spent: 0, balance: 5 });
  expect(result.suns.earned).toBe(0);
});

it("resolves a confirmed task from retained family history", () => {
  expect(
    parentWalletBreakdown(
      { stars: 0, suns: 3 },
      {
        tasks: [],
        taskHistory: [{ ...task("Tidy books", "real", 3), status: "done", day: "2026-11-15" }],
        feed: [event("task-confirmed", 3, "Tidy books")],
      },
    ).suns,
  ).toEqual({ other: 0, earned: 3, spent: 0, balance: 3 });
});

it("groups and filters newest-first feed events on the family day without mutating input", () => {
  const feed: FeedItem[] = [
    { ...event("game", 10), at: "2026-11-16T04:30:00Z" },
    { ...event("gift-bought", 2), at: "2026-11-16T06:00:00Z" },
    { ...event("video", 15), at: "2026-11-16T05:30:00Z" },
  ];
  expect(parentFeedDays(feed, "America/New_York")).toEqual([
    { day: "2026-11-16", items: [feed[1], feed[2]] },
    { day: "2026-11-15", items: [feed[0]] },
  ]);
  expect(parentFeedDays(feed, "America/New_York", "family")[0]?.items).toEqual([feed[1]]);
  expect(feed[0]?.kind).toBe("game");
});

it("uses encouraging energy labels at each status boundary", () => {
  expect([0, 24, 25, 49, 50, 74, 75, 100].map(parentEnergyBand)).toEqual([
    "rest",
    "rest",
    "warming",
    "warming",
    "ready",
    "ready",
    "bright",
    "bright",
  ]);
});

it("totals only saved learning and science activity for all seven days", () => {
  const report = parentWeekReport({ learning: [2, 3.5], science: [10, 0, 5] });
  expect(report.days).toHaveLength(7);
  expect(report.days[0]).toEqual({ learning: 2, science: 10, total: 12 });
  expect(report.total).toBe(20.5);
  expect(report.max).toBe(12);
  expect(parentWeekReport().total).toBe(0);
  expect(parentWeekReport().max).toBe(1);
});
