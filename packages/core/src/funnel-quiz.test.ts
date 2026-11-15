import { describe, expect, it } from "vitest";
import { stageOf } from "./brainy";
import { isFunnelAnswers } from "./funnel";
import {
  ANNUAL,
  clock,
  commercialPlans,
  funnelBodyAnswers,
  funnelBodyStats,
  funnelHealth,
  funnelSignals,
  MONTHLY,
  parseStartRequest,
  planLegal,
  type QuizDraft,
  reachable,
  restoreQuiz,
  sanitizeDraft,
  starterLeft,
  toFamilyPlan,
} from "./funnel-quiz";
import { quizStart } from "./onboarding";

const good: QuizDraft = {
  duration: "lt30",
  content: "learn",
  finish: "yes",
  handoff: "easy",
  reading: "daily",
};
const typical: QuizDraft = {
  duration: "120-240",
  content: "shorts",
  finish: "switch",
  handoff: "more",
  reading: "rare",
};
const middle: QuizDraft = {
  duration: "60-120",
  content: "shows",
  finish: "some",
  handoff: "remind",
  reading: "week",
};
const full: QuizDraft = {
  ...typical,
  age: "6-7",
  name: "Leo",
  guilt: 4,
  limits: 5,
  attempt: ["limits"],
  goal: ["finish", "read"],
  minutes: "15",
  gift: "movie",
};

describe("brain meter", () => {
  it("starts at 80 and is computed from the answers, not accumulated", () => {
    expect(funnelHealth({})).toBe(80);
    expect(funnelHealth({ duration: "240+" })).toBe(62);
    expect(funnelHealth({ duration: "240+", content: "shorts" })).toBe(48);
    expect(funnelHealth({ duration: "lt30" })).toBe(78);
    expect(funnelHealth({ ...typical, duration: "lt30" })).toBeGreaterThan(funnelHealth(typical));
  });
  it("is responsive: good stays clean, middle shows spots, iPad-kid path rots", () => {
    expect(funnelHealth(good)).toBeGreaterThanOrEqual(76);
    const mid = funnelHealth(middle);
    expect(mid).toBeLessThan(60);
    expect(mid).toBeGreaterThanOrEqual(45);
    const bad = funnelHealth(typical);
    expect(bad).toBeGreaterThanOrEqual(20);
    expect(bad).toBeLessThanOrEqual(25);
  });
  it("bottoms out above the floor on the worst possible answers", () => {
    const worst = {
      duration: "240+",
      content: "shorts",
      finish: "switch",
      handoff: "melt",
      reading: "never",
    };
    expect(funnelHealth(worst)).toBe(12);
  });
  it("uses the best value for unanswered questions in the body stats", () => {
    expect(funnelBodyAnswers({})).toEqual({
      hours: 3,
      content: 3,
      finish: 3,
      reaction: 3,
      reads: 3,
    });
    expect(funnelBodyStats(typical)).toEqual(quizStart(funnelBodyAnswers(typical)).stats);
    expect(stageOf(funnelBodyStats(typical)).index).toBeLessThanOrEqual(
      stageOf(funnelBodyStats(good)).index,
    );
  });
  it("maps answers to quiz answers", () => {
    expect(funnelBodyAnswers(typical)).toEqual({
      hours: 0,
      content: 0,
      finish: 0,
      reaction: 1,
      reads: 1,
    });
    expect(funnelBodyAnswers(good)).toEqual({
      hours: 3,
      content: 3,
      finish: 3,
      reaction: 3,
      reads: 3,
    });
  });
  it("builds three signal bars with levels", () => {
    const s = funnelSignals(typical);
    expect(s.map((x) => x.id)).toEqual(["focus", "reading", "calm"]);
    expect(s.every((x) => x.value >= 10 && x.value <= 100)).toBe(true);
    expect(funnelSignals(good).every((x) => x.level === "on")).toBe(true);
    expect(s[0]?.level).toBe("low");
  });
});

describe("old family-plan adapter", () => {
  it("produces a valid saved plan", () => {
    const plan = toFamilyPlan(full);
    expect(isFunnelAnswers(plan)).toBe(true);
    expect(plan).toMatchObject({ goal: "ending", attempt: "timer", moment: "flex", age: "6-7" });
  });
  it("maps goals and attempts by first selection", () => {
    expect(toFamilyPlan({ ...full, goal: ["read"] }).goal).toBe("learning");
    expect(toFamilyPlan({ ...full, goal: ["curious", "finish"] }).goal).toBe("learning");
    expect(toFamilyPlan({ ...full, goal: ["help"] }).goal).toBe("offline");
    expect(toFamilyPlan({ ...full, goal: undefined }).goal).toBe("explore");
    for (const [a, old] of [
      ["away", "away"],
      ["timer", "warning"],
      ["apps", "choice"],
      ["none", "new"],
    ] as const)
      expect(toFamilyPlan({ ...full, attempt: [a] }).attempt).toBe(old);
  });
});

describe("routing and storage", () => {
  it("does not let deep links skip unanswered screens", () => {
    expect(reachable("offer", {})).toBe("duration");
    expect(reachable("content", { duration: "lt30" })).toBe("content");
    expect(reachable("guilt", good)).toBe("child");
    expect(reachable("nope", full)).toBe("duration");
    expect(reachable("offer", full)).toBe("offer");
  });
  it("sends other ages to the exit screen", () => {
    expect(reachable("guilt", { ...good, age: "other" })).toBe("exit");
    expect(reachable("child", { ...good, age: "other" })).toBe("child");
  });
  it("restores a clean draft and drops bad values", () => {
    const raw = JSON.stringify({
      version: 1,
      screen: "offer",
      answers: { ...full, plan: "x", bad: 1, guilt: 9 },
    });
    const r = restoreQuiz(raw);
    expect(r.draft.guilt).toBeUndefined();
    expect(r.draft.name).toBe("Leo");
    expect(r.screen).toBe("guilt");
    for (const bad of [null, "{", "[]", '{"version":9}'])
      expect(restoreQuiz(bad).screen).toBe("duration");
  });
  it("sanitises names and the exclusive 'none' attempt", () => {
    expect(sanitizeDraft({ name: " <b>leo</b> " }).name).toBe("Bleo/b");
    expect(sanitizeDraft({ attempt: ["limits", "none"] }).attempt).toEqual(["none"]);
  });
});

describe("offer", () => {
  it("computes display-only prices from the two constants", () => {
    const p = commercialPlans();
    expect([MONTHLY, ANNUAL]).toEqual([14.99, 79.99]);
    expect(p.monthly.perYear).toBe(179.88);
    expect(p.annual).toMatchObject({
      price: 79.99,
      perMonth: 6.67,
      strike: 179.88,
      savePercent: 56,
    });
    expect(planLegal("annual")).toContain("$79.99 today, then $79.99 every year");
    expect(planLegal("monthly")).toContain("$14.99 today, then $14.99 every month");
  });
  it("runs an honest countdown that stops at zero", () => {
    expect(starterLeft(15 * 60_000, 0)).toBe(900);
    expect(starterLeft(1000, 5000)).toBe(0);
    expect(clock(905)).toBe("15:05");
    expect(clock(0)).toBe("00:00");
  });
});

describe("start request", () => {
  const body = { funnel: full, childName: "Leo", plan: "annual", starterPack: true };
  it("accepts a complete request and derives mood, plan and quiz", () => {
    const r = parseStartRequest(body);
    expect(r).not.toBeNull();
    expect(r?.health).toBe(funnelHealth(full));
    expect(r?.startMood).toBe(30);
    expect(r?.birthBand).toBe("6-7");
    expect(r?.email).toBe("");
    expect(isFunnelAnswers(r?.familyPlan)).toBe(true);
  });
  it("keeps a valid email and rejects bad requests", () => {
    expect(parseStartRequest({ ...body, email: "p@example.com" })?.email).toBe("p@example.com");
    expect(parseStartRequest({ ...body, email: "nope" })?.email).toBe("");
    for (const bad of [
      null,
      { ...body, plan: "free" },
      { ...body, starterPack: "yes" },
      { ...body, funnel: { ...full, age: "other" } },
      { ...body, funnel: { ...full, duration: undefined } },
    ])
      expect(parseStartRequest(bad)).toBeNull();
  });
});
