import { describe, expect, it } from "vitest";
import {
  applyShowcaseAction,
  navigationCounts,
  PARENT_ACTIONS,
  parseShowcaseAction,
  type Showcase,
  TASKS_PER_DAY,
} from "./showcase";

const base: Showcase = {
  equipped: {},
  owned: [],
  earned: [],
  weekGoal: { earned: 6, target: 10, giftId: "cinema", due: "Sun" },
  tasks: [
    {
      id: "a",
      title: "Tidy up",
      place: "real",
      skill: "Responsibility",
      reward: 2,
      status: "todo",
    },
  ],
  templates: [],
  recommendations: [
    {
      id: "r",
      skill: "Attention",
      value: 41,
      average: 52,
      part: "Eyes",
      why: "",
      items: [{ id: "i", title: "Puzzle", reward: 3, duration: "20 min" }],
    },
  ],
  gifts: [
    { id: "cinema", title: "Movie", price: 10 },
    { id: "ice", title: "Ice cream", price: 3 },
  ],
  requests: [],
  fun: [
    {
      id: "rocket",
      title: "Rocket",
      skill: "",
      icon: "rocket",
      priceTimed: 30,
      priceForever: 500,
      forever: false,
      until: null,
    },
  ],
  cartoons: [],
  science: [
    {
      id: "v",
      title: "Ocean",
      minutes: 24,
      icon: "wave",
      colors: ["#000", "#111"],
      question: "?",
      options: ["a", "b", "c"],
      answer: 0,
      position: 0,
      solved: false,
    },
  ],
  ageAverages: { speech: 50, reading: 50, logic: 50, attention: 50, memory: 50, motor: 50 },
  entryLog: { took: 0, other: 0 },
  feed: [],
  analytics: {} as Showcase["analytics"],
};
const input = (showcase = base, stars = 100, suns = 5) => ({
  showcase,
  wallet: { stars, suns },
  now: new Date("2026-11-14T10:00:00Z"),
  id: "new-id",
});

describe("showcase actions", () => {
  it("task: child done → parent confirm pays suns, goal progress and resp", () => {
    const done = applyShowcaseAction(input(), { type: "task-done", taskId: "a" });
    expect(done.ok && done.showcase.tasks[0]?.status).toBe("check");
    if (!done.ok) throw new Error();
    const confirmed = applyShowcaseAction(input(done.showcase), {
      type: "task-confirm",
      taskId: "a",
    });
    expect(confirmed).toMatchObject({ ok: true, wallet: { suns: 7 }, gains: { resp: 2 } });
    if (confirmed.ok) expect(confirmed.showcase.weekGoal.earned).toBe(8);
    expect(applyShowcaseAction(input(), { type: "task-confirm", taskId: "a" }).ok).toBe(false);
  });

  it("enforces five tasks a day", () => {
    const firstTask = base.tasks[0] ?? {
      id: "t0",
      title: "Chore",
      place: "real" as const,
      skill: "X",
      reward: 1,
      status: "todo" as const,
    };
    const full = {
      ...base,
      tasks: Array.from({ length: TASKS_PER_DAY }, (_, i) => ({ ...firstTask, id: `t${i}` })),
    };
    const add = { type: "task-add", title: "More", place: "real", skill: "X", reward: 1 } as const;
    expect(applyShowcaseAction(input(full), add)).toEqual({ ok: false, reason: "daily-limit" });
    expect(applyShowcaseAction(input(), add).ok).toBe(true);
  });

  it("gifts cost suns only and create a request", () => {
    const bought = applyShowcaseAction(input(), { type: "buy-gift", giftId: "ice" });
    expect(bought).toMatchObject({ ok: true, wallet: { stars: 100, suns: 2 } });
    if (bought.ok)
      expect(bought.showcase.requests[0]).toMatchObject({ title: "Ice cream", delivered: false });
    expect(applyShowcaseAction(input(), { type: "buy-gift", giftId: "cinema" }).ok).toBe(false);
  });

  it("accessories: buy wears the item; equip requires ownership", () => {
    const bought = applyShowcaseAction(input(), { type: "buy-accessory", id: "cap" });
    expect(bought).toMatchObject({
      ok: true,
      wallet: { stars: 40 },
      showcase: { equipped: { head: "cap" } },
    });
    expect(applyShowcaseAction(input(), { type: "equip", id: "cap" }).ok).toBe(false);
  });

  it("video stars only after the end and a correct answer, once", () => {
    expect(applyShowcaseAction(input(), { type: "video-answer", id: "v", answer: 0 }).ok).toBe(
      false,
    );
    const watched = applyShowcaseAction(input(), { type: "video-position", id: "v", position: 99 });
    if (!watched.ok) throw new Error();
    expect(watched.showcase.science[0]?.position).toBe(24);
    expect(
      applyShowcaseAction(input(watched.showcase), { type: "video-answer", id: "v", answer: 1 }),
    ).toEqual({
      ok: false,
      reason: "wrong-answer",
    });
    const right = applyShowcaseAction(input(watched.showcase), {
      type: "video-answer",
      id: "v",
      answer: 0,
    });
    expect(right).toMatchObject({ ok: true, wallet: { stars: 115 }, gains: { eyes: 2 } });
  });

  it("timed fun unlock lasts ten minutes", () => {
    const timed = applyShowcaseAction(input(), {
      type: "unlock-fun",
      gameId: "rocket",
      mode: "timed",
    });
    expect(timed).toMatchObject({ ok: true, wallet: { stars: 70 } });
    if (timed.ok) expect(timed.showcase.fun[0]?.remainingSeconds).toBe(600);
  });

  it("rejects unknown or malformed actions", () => {
    expect(parseShowcaseAction({ type: "steal" })).toBeNull();
    expect(parseShowcaseAction({ type: "equip", id: "crown" })).toBeNull();
    expect(parseShowcaseAction({ type: "exchange", suns: 1 })).toEqual({
      type: "exchange",
      suns: 1,
    });
  });
});

it("cancels only assigned tasks, without paying or mutating the original", () => {
  expect(PARENT_ACTIONS.has("task-cancel")).toBe(true);
  expect(parseShowcaseAction({ type: "task-cancel", taskId: "a" })).not.toBeNull();
  const result = applyShowcaseAction(input(), { type: "task-cancel", taskId: "a" });
  expect(result).toMatchObject({
    ok: true,
    wallet: { stars: 100, suns: 5 },
    showcase: { tasks: [], weekGoal: base.weekGoal },
  });
  expect(base.tasks).toHaveLength(1);
  if (!result.ok) throw new Error();
  expect(applyShowcaseAction(input(result.showcase), { type: "task-cancel", taskId: "a" }).ok).toBe(
    false,
  );
  for (const status of ["check", "done"] as const) {
    const showcase = { ...base, tasks: base.tasks.map((task) => ({ ...task, status })) };
    expect(applyShowcaseAction(input(showcase), { type: "task-cancel", taskId: "a" })).toEqual({
      ok: false,
      reason: "invalid-task",
    });
  }
});

it("counts only assigned real tasks, pending confirmations and undelivered gifts", () => {
  const tasks = [
    ...base.tasks,
    { ...base.tasks[0], id: "app", place: "app" as const },
    { ...base.tasks[0], id: "check", status: "check" as const },
    { ...base.tasks[0], id: "done", status: "done" as const },
  ] as Showcase["tasks"];
  const requests = [
    { id: "r1", giftId: "gift", title: "Gift", at: "2026-11-14", delivered: false },
    { id: "r2", giftId: "gift", title: "Gift", at: "2026-11-14", delivered: true },
  ];
  expect(navigationCounts({ tasks, requests })).toEqual({
    childGifts: 1,
    parentTasks: 1,
    parentRewards: 1,
  });
  expect(navigationCounts({ tasks: [], requests: [] })).toEqual({
    childGifts: 0,
    parentTasks: 0,
    parentRewards: 0,
  });
});
