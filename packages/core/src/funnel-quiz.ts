// Brain Check funnel rules (D-40, D-41). Pure: no storage, network, rewards or payment.
import type { FunnelAnswers } from "./funnel";
import { isFunnelAnswers } from "./funnel";
import { MOOD_FLOOR, type QuizAnswers, quizStart } from "./onboarding";

/** Screen order. `exit` is the helpful dead end for ages outside 4–10. */
export const QUIZ_SCREENS = [
  "duration",
  "content",
  "finish",
  "handoff",
  "reading",
  "child",
  "guilt",
  "limits",
  "attempt",
  "analyze",
  "reveal",
  "ontime",
  "goal",
  "solution",
  "minutes",
  "gift",
  "build",
  "email",
  "offer",
] as const;
export type QuizScreen = (typeof QUIZ_SCREENS)[number];
export const QUIZ_SECTIONS = ["Habits", "Your child", "Results", "Your plan"] as const;
/** Section index of every screen, for the four-segment progress bar. */
export const SCREEN_SECTION: Record<QuizScreen | "exit", number> = {
  duration: 0,
  content: 0,
  finish: 0,
  handoff: 0,
  reading: 0,
  child: 1,
  guilt: 1,
  limits: 1,
  attempt: 1,
  analyze: 2,
  reveal: 2,
  ontime: 2,
  goal: 3,
  solution: 3,
  minutes: 3,
  gift: 3,
  build: 3,
  email: 3,
  offer: 3,
  exit: 1,
};

export const HEALTH_START = 80;
export const HEALTH_FLOOR = 11;

/** Behaviour questions in order, with each option's health drain. */
export const BEHAVIOUR = {
  duration: { lt30: 2, "30-60": 6, "60-120": 10, "120-240": 14, "240+": 18 },
  content: { shorts: 14, ytk: 10, shows: 6, games: 6, learn: 2 },
  finish: { yes: 0, some: 6, switch: 12, unsure: 4 },
  handoff: { easy: 0, remind: 3, more: 7, melt: 12 },
  reading: { daily: 0, week: 3, rare: 9, never: 12 },
} as const satisfies Record<string, Record<string, number>>;
export type BehaviourId = keyof typeof BEHAVIOUR;
export const BEHAVIOUR_IDS = Object.keys(BEHAVIOUR) as BehaviourId[];

export const AGES = ["4-5", "6-7", "8-10", "other"] as const;
export type QuizAge = (typeof AGES)[number];
export const ATTEMPTS = ["limits", "apps", "away", "timer", "none"] as const;
export const GOALS = ["finish", "read", "stop", "curious", "help"] as const;
export const MINUTES = ["10", "15", "20"] as const;
export const GIFTS = ["ice", "movie", "park", "later"] as const;
export type FunnelGift = (typeof GIFTS)[number];
export type PlanChoice = "annual" | "monthly";

export type QuizDraft = {
  duration?: string;
  content?: string;
  finish?: string;
  handoff?: string;
  reading?: string;
  name?: string;
  age?: QuizAge;
  guilt?: number;
  limits?: number;
  attempt?: string[];
  goal?: string[];
  minutes?: string;
  gift?: string;
  earn?: boolean;
  email?: string;
  plan?: PlanChoice;
};

const has = (o: object, k: unknown): k is string => typeof k === "string" && Object.hasOwn(o, k);
const inList = (list: readonly string[], v: unknown) => typeof v === "string" && list.includes(v);

/** Drain of one answer; unanswered or unknown values drain nothing. */
export function drainOf(id: BehaviourId, value: unknown) {
  const table: Record<string, number> = BEHAVIOUR[id];
  return has(table, value) ? (table[value] ?? 0) : 0;
}
/** Computed from the answers every time, never accumulated, so Back stays correct. */
export function funnelHealth(draft: QuizDraft) {
  const drain = BEHAVIOUR_IDS.reduce((sum, id) => sum + drainOf(id, draft[id]), 0);
  return Math.max(HEALTH_FLOOR, HEALTH_START - drain);
}

/** Family plan answers adapted to the old single-choice shape (see `toFamilyPlan`). */
const OLD = {
  duration: { lt30: "little", "30-60": "half", "60-120": "one", "120-240": "two", "240+": "two" },
  content: { shorts: "clips", ytk: "kids", shows: "shows", games: "games", learn: "games" },
  finish: { yes: "usually", some: "sometimes", switch: "switch", unsure: "unknown" },
  handoff: { easy: "easy", remind: "reminder", more: "bargain", melt: "hard" },
  reading: { daily: "alone", week: "together", rare: "early", never: "rare" },
} as const;
const BEST_OLD = {
  duration: "little",
  content: "shows",
  finish: "usually",
  handoff: "easy",
  reading: "alone",
} as const;
const ATTEMPT_OLD: Record<string, string> = {
  limits: "timer",
  away: "away",
  timer: "warning",
  apps: "choice",
  none: "new",
};
const GOAL_OLD: Record<string, string> = {
  finish: "ending",
  stop: "ending",
  read: "learning",
  curious: "learning",
  help: "offline",
};
/** Age bands the existing family-plan rules know. */
export const bandOf = (age: unknown): "4-5" | "6-7" | "8-10" | null =>
  age === "4-5" || age === "6-7" || age === "8-10" ? age : null;

/**
 * Adapter to the saved family-plan shape. Unanswered behaviour questions use the best value
 * so the preview matches what is saved; `age` falls back to the 6–7 band only for previews.
 */
export function toFamilyPlan(draft: QuizDraft): FunnelAnswers {
  const pick = <K extends BehaviourId>(id: K): string => {
    const map: Record<string, string> = OLD[id];
    const v = draft[id];
    return has(map, v) ? (map[v] as string) : BEST_OLD[id];
  };
  const first = draft.goal?.[0];
  const firstAttempt = draft.attempt?.[0];
  return {
    goal: has(GOAL_OLD, first) ? (GOAL_OLD[first] as string) : "explore",
    age: bandOf(draft.age) ?? "6-7",
    duration: pick("duration"),
    content: pick("content"),
    finish: pick("finish"),
    handoff: pick("handoff"),
    reading: pick("reading"),
    attempt: has(ATTEMPT_OLD, firstAttempt) ? (ATTEMPT_OLD[firstAttempt] as string) : "new",
    moment: "flex",
  };
}

/** Quiz answers for the saved Brainy. Unanswered questions count as the best value. */
export function funnelBodyAnswers(draft: QuizDraft): QuizAnswers {
  const old = toFamilyPlan(draft);
  const hours = { two: 0, one: 1, half: 2, little: 3 } as const;
  const content = { clips: 0, kids: 2, shows: 3, games: 3 } as const;
  const finish = { switch: 0, sometimes: 1, unknown: 1, usually: 3 } as const;
  const reaction = { hard: 0, bargain: 1, reminder: 2, easy: 3 } as const;
  const reads = { rare: 0, early: 1, together: 2, alone: 3 } as const;
  const get = <T extends Record<string, number>>(m: T, k: string) => m[k] ?? 3;
  return {
    hours: get(hours, old.duration),
    content: get(content, old.content),
    finish: get(finish, old.finish),
    reaction: get(reaction, old.handoff),
    reads: get(reads, old.reading),
  };
}
/** Body stats of the funnel brain: the same ones the app saves for the new family. */
export const funnelBodyStats = (draft: QuizDraft) => quizStart(funnelBodyAnswers(draft)).stats;

/** The three signal bars of the reveal: 10…100, with the typical-for-age marker. */
export const SIGNAL_MARKER = 72;
export type SignalLevel = "low" | "below" | "on";
export function funnelSignals(draft: QuizDraft) {
  const d = (id: BehaviourId) => drainOf(id, draft[id]);
  const bar = (raw: number) => Math.max(10, Math.min(100, Math.round(raw)));
  const level = (v: number): SignalLevel => (v < 45 ? "low" : v < 70 ? "below" : "on");
  return (
    [
      ["focus", bar(100 - (d("finish") + d("content")) * 3.2)],
      ["reading", bar(100 - d("reading") * 6.2)],
      ["calm", bar(100 - d("handoff") * 6)],
    ] as const
  ).map(([id, value]) => ({ id, value, level: level(value) }));
}

/** True when this screen's own answer is present (display-only screens always pass). */
export function answered(screen: QuizScreen | "exit", d: QuizDraft) {
  switch (screen) {
    case "duration":
    case "content":
    case "finish":
    case "handoff":
    case "reading":
      return has(BEHAVIOUR[screen], d[screen]);
    case "child":
      return bandOf(d.age) !== null || d.age === "other";
    case "guilt":
    case "limits":
      return (
        Number.isInteger(d[screen]) && (d[screen] as number) >= 1 && (d[screen] as number) <= 5
      );
    case "attempt":
      return !!d.attempt?.length;
    case "goal":
      return !!d.goal?.length;
    case "minutes":
      return inList(MINUTES, d.minutes);
    case "gift":
      return inList(GIFTS, d.gift);
    default:
      return true;
  }
}
/** The first screen the parent has not completed before `target`, so deep links cannot skip. */
export function reachable(target: string, d: QuizDraft): QuizScreen | "exit" {
  if (d.age === "other") return target === "child" ? "child" : "exit";
  if (target === "exit") return "child";
  const to = (QUIZ_SCREENS as readonly string[]).indexOf(target);
  if (to < 0) return "duration";
  for (const s of QUIZ_SCREENS.slice(0, to)) if (!answered(s, d)) return s;
  return target as QuizScreen;
}

export const QUIZ_STORAGE_KEY = "brainy.brain-check.v1";
export const QUIZ_VERSION = 1;
export const STARTER_DEADLINE_KEY = "brainy.brain-check.starter-deadline";
export const STARTER_MS = 15 * 60 * 1000;

const NAME_MAX = 20;
/** First name for display and saving: trimmed, capitalised, no markup. Empty stays empty. */
export function cleanName(raw: unknown) {
  const t = typeof raw === "string" ? raw.replace(/[<>]/g, "").replace(/\s+/g, " ").trim() : "";
  const name = t.slice(0, NAME_MAX).trim();
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : "";
}
const optionalEmail = (raw: unknown) => {
  const t = typeof raw === "string" ? raw.trim() : "";
  return t.length > 0 && t.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? t : "";
};
const subset = (list: readonly string[], v: unknown) =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => inList(list, x)))] : [];

/** Keep only known, in-range values. Used for storage and for the start request. */
export function sanitizeDraft(raw: unknown): QuizDraft {
  const r = (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as Record<
    string,
    unknown
  >;
  const out: QuizDraft = {};
  for (const id of BEHAVIOUR_IDS) if (has(BEHAVIOUR[id], r[id])) out[id] = r[id] as string;
  if (inList(AGES, r.age)) out.age = r.age as QuizAge;
  const name = cleanName(r.name);
  if (name) out.name = name;
  for (const id of ["guilt", "limits"] as const) {
    const n = r[id];
    if (Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 5) out[id] = n as number;
  }
  const attempt = subset(ATTEMPTS, r.attempt);
  if (attempt.length) out.attempt = attempt.includes("none") ? ["none"] : attempt;
  const goal = subset(GOALS, r.goal);
  if (goal.length) out.goal = goal;
  if (inList(MINUTES, r.minutes)) out.minutes = r.minutes as string;
  if (inList(GIFTS, r.gift)) out.gift = r.gift as string;
  if (typeof r.earn === "boolean") out.earn = r.earn;
  const email = optionalEmail(r.email);
  if (email) out.email = email;
  if (r.plan === "annual" || r.plan === "monthly") out.plan = r.plan;
  return out;
}

export function restoreQuiz(raw: string | null): { screen: QuizScreen | "exit"; draft: QuizDraft } {
  try {
    const state = JSON.parse(raw ?? "null");
    if (state?.version !== QUIZ_VERSION) return { screen: "duration", draft: {} };
    const draft = sanitizeDraft(state.answers);
    return { screen: reachable(String(state.screen), draft), draft };
  } catch {
    return { screen: "duration", draft: {} };
  }
}

// ---- Offer (D-41): display-only prices, no payment of any kind ----
export const MONTHLY = 14.99;
export const ANNUAL = 79.99;
const cents = (n: number) => Math.round(n * 100) / 100;
export const money = (n: number) => `$${n.toFixed(2)}`;
/** Display prices computed from the two constants. */
export function commercialPlans() {
  const yearlyAtMonthly = cents(MONTHLY * 12);
  return {
    monthly: { id: "monthly" as const, price: MONTHLY, perYear: yearlyAtMonthly },
    annual: {
      id: "annual" as const,
      price: ANNUAL,
      perMonth: cents(ANNUAL / 12),
      strike: yearlyAtMonthly,
      savePercent: Math.round((1 - ANNUAL / yearlyAtMonthly) * 100),
    },
  };
}
export function planLegal(plan: PlanChoice) {
  return plan === "annual"
    ? `${money(ANNUAL)} today, then ${money(ANNUAL)} every year until you cancel. Cancel anytime in your account.`
    : `${money(MONTHLY)} today, then ${money(MONTHLY)} every month until you cancel. Cancel anytime in your account.`;
}

// ---- Starter Pack ----
export const STARTER_STARS = 100;
export const STARTER_ACCESSORY = "cape";

/** Seconds left of the honest 15-minute timer; the deadline is fixed on the first offer view. */
export const starterLeft = (deadline: number, now: number) =>
  Math.max(0, Math.ceil((deadline - now) / 1000));
export const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

/** Start-plan request, validated at the server boundary. */
export type StartRequest = {
  draft: QuizDraft;
  childName: string;
  email: string;
  plan: PlanChoice;
  starterPack: boolean;
  familyPlan: FunnelAnswers;
  quiz: QuizAnswers;
  health: number;
  startMood: number;
  birthBand: "4-5" | "6-7" | "8-10";
};
export function parseStartRequest(raw: unknown): StartRequest | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const draft = sanitizeDraft(r.funnel);
  const band = bandOf(draft.age);
  if (!band || !BEHAVIOUR_IDS.every((id) => draft[id])) return null;
  if (r.plan !== "annual" && r.plan !== "monthly") return null;
  if (typeof r.starterPack !== "boolean") return null;
  const familyPlan = toFamilyPlan(draft);
  if (!isFunnelAnswers(familyPlan)) return null;
  const health = funnelHealth(draft);
  return {
    draft,
    childName: cleanName(r.childName) || draft.name || "",
    email: optionalEmail(r.email),
    plan: r.plan,
    starterPack: r.starterPack,
    familyPlan,
    quiz: funnelBodyAnswers(draft),
    health,
    startMood: Math.max(MOOD_FLOOR, Math.min(100, health)),
    birthBand: band,
  };
}
