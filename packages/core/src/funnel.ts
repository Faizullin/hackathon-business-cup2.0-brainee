// Ported from the local Brainy Funnel Export. Pure rules; no storage, network or rewards.
import {
  ATTEMPT,
  ageNotes,
  bookNotes,
  contentInsight,
  cues,
  FUNNEL_QUESTIONS,
  familyTaskTitles,
  finishNotes,
  formats,
  funnelCopy,
  goals,
  handoffNotes,
  lookFor,
  MOMENT,
  moments,
  previousCue,
  profileReasons,
  profiles,
  timeNotes,
  weekCopy,
  weekEstimates,
} from "./funnel-copy";
import type { QuizAnswers } from "./onboarding";

export { ATTEMPT, coverAngles, FUNNEL_QUESTIONS, MOMENT, previousCue } from "./funnel-copy";

export type FunnelQuestionId =
  | "goal"
  | "age"
  | "duration"
  | "content"
  | "finish"
  | "handoff"
  | "reading"
  | "attempt"
  | "moment";
export type FunnelAnswers = Record<FunnelQuestionId, string>;
export type FunnelDraft = Partial<FunnelAnswers>;
export interface FunnelQuestion {
  id: FunnelQuestionId;
  title: string;
  section?: string;
  hint: string;
  options: { value: string; label: string }[];
}

export const STORAGE_KEY = "brainy.us-parent-quiz.v2";
export const VERSION = 4;

export const ROUTE = [
  "cover",
  "welcome",
  "growth",
  "feed",
  "match",
  "reward",
  "personalize",
  "goal",
  "age",
  "handoff",
  "content",
  "finish",
  "reading",
  "pause",
  "duration",
  "profile",
  "week",
  "attempt",
  "method",
  "parent",
  "example",
  "benefits",
  "moment",
  "result",
  "offer",
];
export const question = (id: string) =>
  id === MOMENT.id
    ? MOMENT
    : id === ATTEMPT.id
      ? ATTEMPT
      : FUNNEL_QUESTIONS.find((q) => q.id === id);
export const choiceLabel = (id: string, val: unknown) =>
  id === "attempt" && val === "unspecified"
    ? funnelCopy.notPreviouslyAsked
    : question(id)?.options.find((o) => o.value === val)?.label;
export const complete = (answers: FunnelDraft) =>
  FUNNEL_QUESTIONS.every((q) => choiceLabel(q.id, answers?.[q.id])) && answers.age !== "outside";
export function reachable(target: string, answers: FunnelDraft) {
  if (answers.age === "outside" && ["outside", "age"].includes(target)) return target;
  if (!ROUTE.includes(target)) return "cover";
  for (const step of ROUTE.slice(0, ROUTE.indexOf(target))) {
    if (step === "age" && answers.age === "outside") return "outside";
    if (question(step) && !choiceLabel(step, answers[step as FunnelQuestionId])) return step;
  }
  return target;
}
export function entryFor(answers: FunnelDraft, bookmark?: string) {
  if (answers.age === "outside") return "age";
  if (
    complete(answers) &&
    choiceLabel("moment", answers.moment) &&
    choiceLabel("attempt", answers.attempt)
  )
    return "result";
  if (bookmark && ROUTE.includes(bookmark) && bookmark !== "cover")
    return reachable(bookmark, answers);
  return (
    ROUTE.find((step) => question(step) && !choiceLabel(step, answers[step as FunnelQuestionId])) ||
    "welcome"
  );
}
export function restoreFunnel(raw: string | null) {
  const blank = { screen: "cover", answers: {}, resumeAt: "welcome" };
  try {
    const state = JSON.parse(raw ?? "null");
    if (
      ![2, 3, VERSION].includes(state?.version) ||
      !state.answers ||
      typeof state.answers !== "object" ||
      Array.isArray(state.answers)
    )
      return blank;
    const answers: FunnelDraft = {};
    for (const q of [...FUNNEL_QUESTIONS, ATTEMPT, MOMENT]) {
      if (choiceLabel(q.id, state.answers[q.id])) answers[q.id] = state.answers[q.id];
    }
    const bookmark = state.screen === "cover" ? state.resumeAt : state.screen;
    if (state.version < 4) {
      if (
        complete(answers) &&
        (answers.moment ||
          (state.version === 2 && ["offer", "method", "result"].includes(bookmark)))
      ) {
        answers.moment ||= "flex";
        answers.attempt = "unspecified";
      }
      if (!complete(answers)) {
        const firstMissing = ROUTE.find(
          (step) => question(step) && !choiceLabel(step, answers[step as FunnelQuestionId]),
        );
        return {
          screen: reachable(typeof state.screen === "string" ? state.screen : "cover", answers),
          answers,
          resumeAt: answers.age === "outside" ? "age" : firstMissing || "welcome",
        };
      }
    }
    const screen = reachable(typeof state.screen === "string" ? state.screen : "cover", answers);
    return { screen, answers, resumeAt: entryFor(answers, bookmark) };
  } catch {
    return blank;
  }
}

export function pauseFor(answers: FunnelDraft) {
  const [title, body] = contentInsight[answers.content ?? "other"] ??
    contentInsight.other ?? ["", ""];
  return { title, body };
}

export function profileFor(answers: FunnelDraft) {
  if (!isFunnelBaseAnswers(answers)) return null;
  const { handoff, finish, content } = answers;
  if (content === "none" || answers.duration === "none") return { ...profiles.occasional };
  if (handoff === "hard" || handoff === "bargain")
    return {
      title: profiles.lastTurn.title,
      why: handoff === "hard" ? profileReasons.hard : profileReasons.bargain,
      lever: profiles.lastTurn.lever,
    };
  if (finish === "switch") return { ...profiles.smallFinish };
  if (handoff === "easy" || handoff === "reminder")
    return {
      title: profiles.familiar.title,
      why: handoff === "easy" ? profileReasons.easy : profileReasons.reminder,
      lever: profiles.familiar.lever,
    };
  return { ...profiles.together };
}

export function weekFor(duration: string) {
  if (weekEstimates[duration])
    return {
      title: weekEstimates[duration],
      body: weekCopy.estimateBody,
    };
  return duration === "none" ? { ...weekCopy.none } : { ...weekCopy.varies };
}

export function planFor(answers: FunnelDraft) {
  if (!isFunnelBaseAnswers(answers)) return null;
  const goal = goals[answers.goal];
  const format = formats[answers.content]?.[0];
  return {
    ...goal,
    moment: moments[answers.moment] || moments.flex,
    cue: cues[answers.content],
    check: lookFor[answers.goal],
    age: (choiceLabel("age", answers.age) ?? "").replace(funnelCopy.yearsOldSuffix, ""),
    steps: [
      {
        label: funnelCopy.before.label,
        title: funnelCopy.before.title,
        body: `${timeNotes[answers.duration]} ${ageNotes[answers.age]}`,
      },
      {
        label: funnelCopy.during.label,
        title: funnelCopy.during.title(format),
        body: finishNotes[answers.finish],
      },
      {
        label: funnelCopy.ending.label,
        title: funnelCopy.ending.title,
        body: [handoffNotes[answers.handoff], previousCue[answers.attempt]]
          .filter(Boolean)
          .join(" "),
      },
      {
        label: funnelCopy.offScreen.label,
        title: funnelCopy.offScreen.title,
        body: bookNotes[answers.reading],
      },
    ],
  };
}

export function planText(answers: FunnelDraft) {
  const plan = planFor(answers);
  if (!plan) return "";
  return [
    funnelCopy.planHeading,
    plan.title,
    funnelCopy.planSummary(plan.age, plan.focus),
    "",
    plan.intro,
    "",
    funnelCopy.planMoment(plan.moment),
    funnelCopy.planCue(plan.cue),
    funnelCopy.planCheck(plan.check),
    "",
    ...plan.steps.map((s, i) => funnelCopy.planStep(i + 1, s.label, s.title, s.body)),
  ].join("\n");
}

/** Billing is deliberately pending. No configuration can enable checkout. */
export function commercialPlans(_config?: unknown): readonly never[] {
  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
export function isFunnelBaseAnswers(value: unknown): value is FunnelAnswers {
  return (
    isRecord(value) &&
    value.age !== "outside" &&
    FUNNEL_QUESTIONS.every((q) => !!choiceLabel(q.id, value[q.id]))
  );
}
/** Accept only known, completed, in-range answers at the signup boundary. */
export function isFunnelAnswers(value: unknown): value is FunnelAnswers {
  return (
    isFunnelBaseAnswers(value) &&
    [ATTEMPT, MOMENT].every((q) => !!choiceLabel(q.id, value[q.id])) &&
    Object.keys(value).every((k) => !!question(k))
  );
}
const quizMap: Record<
  keyof QuizAnswers,
  { question: FunnelQuestionId; values: Record<string, number> }
> = {
  hours: {
    question: "duration",
    values: { two: 0, one: 1, varies: 1, half: 2, little: 3, none: 3 },
  },
  content: {
    question: "content",
    values: { clips: 0, kids: 2, other: 2, shows: 3, games: 3, none: 3 },
  },
  finish: { question: "finish", values: { switch: 0, sometimes: 1, unknown: 1, usually: 3 } },
  reaction: {
    question: "handoff",
    values: { hard: 0, bargain: 1, varies: 1, reminder: 2, easy: 3 },
  },
  reads: { question: "reading", values: { rare: 0, early: 1, together: 2, both: 2, alone: 3 } },
};
export function funnelQuizAnswers(answers: FunnelAnswers): QuizAnswers {
  if (!isFunnelAnswers(answers)) throw new RangeError(funnelCopy.invalidAnswers);
  return Object.fromEntries(
    Object.entries(quizMap).map(([key, map]) => [key, map.values[answers[map.question]]]),
  ) as QuizAnswers;
}
/** Birth-year ages match the existing minAge convention; signup asks for the exact year. */
export function funnelBirthYears(
  age: string,
  currentYear: number,
): { min: number; max: number } | null {
  if (!Number.isInteger(currentYear) || currentYear < 1900)
    throw new RangeError(funnelCopy.invalidYear);
  const bands: Record<string, [number, number]> = { "4-5": [4, 5], "6-7": [6, 7], "8-10": [8, 10] };
  const band = Object.hasOwn(bands, age) ? bands[age] : undefined;
  return band ? { min: currentYear - band[1], max: currentYear - band[0] } : null;
}

/** A suggested real task only; adding and approving it still use the ordinary task rules. */
export function familyTaskTemplate(answers: FunnelDraft) {
  if (!isFunnelAnswers(answers)) return null;
  return {
    title: familyTaskTitles[answers.reading] as string,
    skill: funnelCopy.readingSkill,
    reward: 1,
    place: "real" as const,
  };
}

/** A preview question, with no session or reward side effects. */
export const FUNNEL_SHAPES = ["circle", "diamond", "triangle"] as const;
export const isFunnelMatch = (shape: string) => shape === "diamond";
