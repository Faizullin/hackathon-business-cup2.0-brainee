import { describe, expect, it } from "vitest";
import {
  ATTEMPT,
  FUNNEL_QUESTIONS,
  type FunnelAnswers,
  funnelBirthYears,
  funnelQuizAnswers,
  isFunnelAnswers,
  MOMENT,
  planFor,
  planText,
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
  it("builds a useful downloadable four-step plan for every answer", () => {
    expect(planFor({})).toBeNull();
    expect(planText({})).toBe("");
    for (const q of FUNNEL_QUESTIONS)
      for (const option of q.options.filter((o) => o.value !== "outside")) {
        const a = { ...answers, [q.id]: option.value };
        expect(planFor(a)?.steps).toHaveLength(4);
        expect(planText(a)).not.toMatch(/undefined|null/);
        expect(planText(a)).toContain(planFor(a)?.cue);
      }
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
