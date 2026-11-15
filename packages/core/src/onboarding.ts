// D-24: the habit quiz runs BEFORE the account exists and sets the starting Brainy.
// Formula from the MVP prototype (git history: b1a3c68:docs/ideas/brainy-mvp.zip, onboarding/quiz.html);
// a methodologist replaces it later. Starting body stats are capped at 40 (Brainy starts sleepy/awake).
import type { SkillScores } from "./stat-gains";
import type { BrainyStats } from "./types";

export const QUIZ_QUESTIONS = ["hours", "content", "finish", "reaction", "reads"] as const;
export type QuizQuestion = (typeof QUIZ_QUESTIONS)[number];
/** Each answer is 0 (worse) … 3 (better). */
export type QuizAnswers = Record<QuizQuestion, number>;
export const QUIZ_START_CAP = 40;

export function isQuizAnswers(value: unknown): value is QuizAnswers {
  if (!value || typeof value !== "object") return false;
  return QUIZ_QUESTIONS.every((q) => {
    const n = (value as Record<string, unknown>)[q];
    return Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 3;
  });
}

export function quizStart(answers: QuizAnswers): { stats: BrainyStats; skills: SkillScores } {
  if (!isQuizAnswers(answers)) throw new RangeError("Invalid quiz answers.");
  const s = QUIZ_QUESTIONS.reduce((sum, q) => sum + answers[q], 0); // 0…15
  const cap = (n: number) => Math.min(QUIZ_START_CAP, n);
  const stats: BrainyStats = {
    brain: cap(10 + s + answers.reads * 2),
    eyes: cap(10 + s + answers.finish * 2),
    mouth: cap(8 + s + answers.reads * 2),
    arms: cap(12 + s),
    legs: cap(12 + s + answers.reaction),
    resp: 10,
  };
  const base = 25 + s * 2;
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  const skills: SkillScores = {
    speech: clamp(base + answers.content * 2),
    reading: clamp(base - 6 + answers.reads * 5),
    logic: clamp(base + 4),
    attention: clamp(base - 4 + answers.finish * 3),
    memory: clamp(base + 2),
    motor: clamp(base + 6),
  };
  return { stats, skills };
}

export const MOOD_DECAY_PER_DAY = 5;
export const MOOD_FLOOR = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Mood fades 5 per idle calendar day (UTC), never below 30. Computed on read: no cron needed. */
export function moodNow(mood: number, lastActive: Date, now: Date) {
  const day = (d: Date) => Math.floor(d.getTime() / DAY_MS);
  const idle = Math.max(0, day(now) - day(lastActive));
  if (idle === 0 || mood <= MOOD_FLOOR) return mood;
  return Math.max(MOOD_FLOOR, mood - MOOD_DECAY_PER_DAY * idle);
}

export const NEUTRAL_QUIZ = { hours: 1, content: 1, finish: 1, reaction: 1, reads: 1 } as const;
