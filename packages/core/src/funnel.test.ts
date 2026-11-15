import { describe, expect, it } from "vitest";
import {
  ATTEMPT,
  commercialPlans,
  entryFor,
  FUNNEL_QUESTIONS,
  type FunnelAnswers,
  funnelBirthYears,
  funnelQuizAnswers,
  isFunnelAnswers,
  MOMENT,
  pauseFor,
  planFor,
  planText,
  profileFor,
  ROUTE,
  reachable,
  restoreFunnel,
  weekFor,
} from "./funnel";
import { quizStart } from "./onboarding";

const answers: FunnelAnswers = {
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
describe("funnel rules", () => {
  it("validates every answer at the boundary, including unknown fields and unsupported ages", () => {
    expect(isFunnelAnswers(answers)).toBe(true);
    for (const q of [...FUNNEL_QUESTIONS, ATTEMPT, MOMENT]) {
      expect(isFunnelAnswers({ ...answers, [q.id]: undefined })).toBe(false);
      expect(isFunnelAnswers({ ...answers, [q.id]: "invalid" })).toBe(false);
      for (const option of q.options) {
        expect(isFunnelAnswers({ ...answers, [q.id]: option.value })).toBe(
          option.value !== "outside",
        );
      }
    }
    for (const invalid of [null, [], "text", { ...answers, checkout: true }])
      expect(isFunnelAnswers(invalid)).toBe(false);
  });
  it("maps the documented five answers without changing quizStart", () => {
    const quiz = funnelQuizAnswers(answers);
    expect(quiz).toEqual({ hours: 1, content: 2, finish: 0, reaction: 1, reads: 2 });
    expect(quizStart(quiz)).toEqual(
      quizStart({ hours: 1, content: 2, finish: 0, reaction: 1, reads: 2 }),
    );
    const cases = {
      duration: { two: 0, one: 1, varies: 1, half: 2, little: 3, none: 3 },
      content: { clips: 0, kids: 2, other: 2, shows: 3, games: 3, none: 3 },
      finish: { switch: 0, sometimes: 1, unknown: 1, usually: 3 },
      handoff: { hard: 0, bargain: 1, varies: 1, reminder: 2, easy: 3 },
      reading: { rare: 0, early: 1, together: 2, both: 2, alone: 3 },
    };
    const keys = {
      duration: "hours",
      content: "content",
      finish: "finish",
      handoff: "reaction",
      reading: "reads",
    } as const;
    for (const q of Object.keys(cases) as (keyof typeof cases)[]) {
      for (const [value, expected] of Object.entries(cases[q]))
        expect(funnelQuizAnswers({ ...answers, [q]: value })[keys[q]]).toBe(expected);
    }
    expect(() => funnelQuizAnswers({ ...answers, age: "outside" })).toThrow(RangeError);
  });
  it("guards deep links and asks age immediately after goal", () => {
    expect(ROUTE[ROUTE.indexOf("goal") + 1]).toBe("age");
    expect(reachable("offer", {})).toBe("goal");
    expect(reachable("result", { goal: "ending" })).toBe("age");
    expect(reachable("result", { ...answers, age: "outside" })).toBe("outside");
    expect(reachable("unknown", answers)).toBe("cover");
    expect(entryFor(answers)).toBe("result");
    expect(entryFor({ goal: "ending" }, "offer")).toBe("age");
  });
  it("restores v2/v3/v4 and discards malformed values without trusting bookmarks", () => {
    for (const version of [2, 3, 4]) {
      expect(restoreFunnel(JSON.stringify({ version, answers, screen: "result" })).resumeAt).toBe(
        "result",
      );
    }
    const { attempt: _, moment: __, ...legacy } = answers;
    const migrated = restoreFunnel(
      JSON.stringify({ version: 2, answers: legacy, screen: "offer" }),
    );
    expect(migrated.answers).toMatchObject({ attempt: "unspecified", moment: "flex" });
    expect(isFunnelAnswers(migrated.answers)).toBe(true);
    for (const raw of [null, "{", "null", "[]", '{"version":1}', '{"version":4,"answers":[]}'])
      expect(restoreFunnel(raw).screen).toBe("cover");
    expect(
      restoreFunnel(
        JSON.stringify({
          version: 4,
          screen: "result",
          answers: { goal: "bad", age: "6-7", extra: true },
        }),
      ).answers,
    ).toEqual({ age: "6-7" });
  });
  it("produces all five profiles and a useful downloadable four-step plan", () => {
    const variants = [
      answers,
      { ...answers, content: "none" },
      { ...answers, handoff: "varies" },
      { ...answers, handoff: "easy", finish: "usually" },
      { ...answers, handoff: "varies", finish: "usually" },
    ];
    expect(new Set(variants.map((a) => profileFor(a)?.title)).size).toBe(5);
    expect(profileFor({})).toBeNull();
    expect(planFor({})).toBeNull();
    expect(planText({})).toBe("");
    for (const q of FUNNEL_QUESTIONS)
      for (const option of q.options.filter((o) => o.value !== "outside")) {
        const a = { ...answers, [q.id]: option.value };
        expect(planFor(a)?.steps).toHaveLength(4);
        expect(planText(a)).not.toMatch(/undefined|null/);
        expect(planText(a)).toContain(planFor(a)?.cue);
      }
    expect(pauseFor(answers).title).toContain("video");
    expect(weekFor("one").title).toBe("7 to under 14 hours");
    expect(weekFor("none").title).toContain("occasional");
    expect(weekFor("varies").title).toContain("One turn");
    expect(commercialPlans({ plans: [{ checkoutUrl: "https://example.com" }] })).toEqual([]);
  });
  it("uses explicit calendar years for age bands and rejects unsupported ages", () => {
    expect(funnelBirthYears("4-5", 2026)).toEqual({ min: 2021, max: 2022 });
    expect(funnelBirthYears("6-7", 2026)).toEqual({ min: 2019, max: 2020 });
    expect(funnelBirthYears("8-10", 2027)).toEqual({ min: 2017, max: 2019 });
    expect(funnelBirthYears("outside", 2026)).toBeNull();
    expect(() => funnelBirthYears("4-5", Number.NaN)).toThrow(RangeError);
  });
});

it("suggests an off-screen task without issuing a reward", async () => {
  const { familyTaskTemplate } = await import("./funnel");
  const valid = {
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
  expect(familyTaskTemplate(valid)).toEqual({
    title: "Share a picture book after putting the screen away",
    place: "real",
    skill: "Reading",
    reward: 1,
  });
  expect(familyTaskTemplate({})).toBeNull();
});

it("keeps demo matching and stage previews pure and aligned with the real stages", async () => {
  const { FUNNEL_SHAPES, isFunnelMatch } = await import("./funnel");
  const { STAGES, stageOf, stagePreviewStats } = await import("./brainy");
  expect(FUNNEL_SHAPES.filter(isFunnelMatch)).toEqual(["diamond"]);
  expect(isFunnelMatch("unknown")).toBe(false);
  for (const stage of STAGES) expect(stageOf(stagePreviewStats(stage.id)).id).toBe(stage.id);
});
