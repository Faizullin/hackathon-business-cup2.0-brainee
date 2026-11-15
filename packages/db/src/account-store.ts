import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import {
  advanceCalendar,
  calendarKeys,
  funnelBirthYears,
  funnelQuizAnswers,
  isFunnelAnswers,
  isQuizAnswers,
  MOOD_FLOOR,
  quizStart,
  type Showcase,
  signupTimeZone,
} from "@brainee/core";
import { eq, sql } from "drizzle-orm";
import {
  brainyStates,
  children,
  demoSessions,
  families,
  parents,
  showcases,
  wallets,
} from "../schema";
import type { Database } from "./client";
import {
  DEMO_ACCESS_MS,
  demoTokenHash,
  LearningStoreError,
  writeTransaction,
} from "./learning-store";
import { demoShowcase } from "./showcase-seed";
import { PARENT_UNLOCK_MS } from "./showcase-store";

// D-24: own minimal accounts (scrypt, httpOnly cookie), no auth provider.
// The habit quiz runs before signup; its answers set the starting Brainy.

export class AccountError extends Error {
  constructor(public readonly reason: "invalid-input" | "email-taken" | "wrong-credentials") {
    super(reason);
  }
}

/** Demo/hackathon parent PIN used by the shared demo, jury families and prefilled signup. */
export const DEMO_PIN = "1234";
export const MIN_CHILD_AGE = 4;
export const MAX_CHILD_AGE = 10;
const STARTER_STARS = 50;

export function hashSecret(secret: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(secret, salt, 64).toString("hex")}`;
}

export function secretMatches(secret: string, stored: string | null) {
  const [scheme, salt, hex] = (stored ?? "").split("$");
  if (scheme !== "scrypt" || !salt || !hex) return false;
  const expected = Buffer.from(hex, "hex");
  return timingSafeEqual(scryptSync(secret, salt, expected.length), expected);
}

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

/** A device session for one child; `parent` also unlocks the parent pages. */
export async function issueAccess(tx: Tx, childId: string, now: Date, parent: boolean) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(now.getTime() + DEMO_ACCESS_MS);
  await tx.insert(demoSessions).values({
    tokenHash: demoTokenHash(token) as string,
    childId,
    createdAt: now,
    expiresAt,
    parentUntil: parent ? new Date(now.getTime() + PARENT_UNLOCK_MS) : null,
  });
  return { token, expiresAt };
}

export type SignupInput = {
  email: string;
  password: string;
  pin: string;
  childName: string;
  birthYear: number;
  answers: unknown;
  funnel?: unknown;
  timeZone?: unknown;
  /** Starting mood of the Brainy (the funnel's health score), clamped to MOOD_FLOOR…100. */
  startMood?: unknown;
};

function validSignup(input: Partial<SignupInput>, now: Date): input is SignupInput {
  const age = now.getUTCFullYear() - Number(input.birthYear);
  return (
    typeof input.email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email) &&
    input.email.length <= 120 &&
    typeof input.password === "string" &&
    input.password.length >= 6 &&
    input.password.length <= 100 &&
    typeof input.pin === "string" &&
    /^\d{4}$/.test(input.pin) &&
    typeof input.childName === "string" &&
    input.childName.trim().length > 0 &&
    input.childName.trim().length <= 40 &&
    Number.isInteger(input.birthYear) &&
    age >= MIN_CHILD_AGE &&
    age <= MAX_CHILD_AGE &&
    isQuizAnswers(input.answers)
  );
}

/** A new family's showcase: the demo catalog, personalised and with history cleared. */
function personalShowcase(childName: string, start: ReturnType<typeof quizStart>): Showcase {
  const showcase = structuredClone(demoShowcase);
  const order = ["speech", "reading", "logic", "attention", "memory", "motor"] as const;
  const skills = order.map((skill) => start.skills[skill]);
  showcase.analytics.quizStats = start.stats;
  showcase.analytics.weeks = 0;
  showcase.analytics.skills = { ...showcase.analytics.skills, now: skills, monthAgo: skills };
  const label = `${childName.trim()} ${childName.trim()[0]?.toUpperCase() ?? ""}.`;
  for (const scope of Object.values(showcase.analytics.ranking))
    for (const table of Object.values(scope))
      for (const row of table.rows) if (row.me) row.name = label;
  showcase.feed = [];
  showcase.requests = [];
  showcase.equipped = {};
  showcase.owned = [];
  showcase.earned = [];
  showcase.entryLog = { took: 0, other: 0 };
  showcase.weekGoal = { ...showcase.weekGoal, earned: 0 };
  showcase.tasks = [];
  showcase.fun = showcase.fun.map((g) => ({
    ...g,
    forever: false,
    until: null,
    remainingSeconds: 0,
  }));
  showcase.science = showcase.science.map((v) => ({
    ...v,
    solved: false,
    position: 0,
    completedAt: undefined,
  }));
  return showcase;
}

/** Trusted server-side additions to a new family, applied in the same transaction. */
export type SignupExtras = { bonusStars?: number; configure?: (showcase: Showcase) => void };

export async function signupFromQuiz(
  db: Database,
  raw: unknown,
  now: Date,
  plan: "demo" | "jury" = "demo",
  extras: SignupExtras = {},
) {
  const input = { ...(raw ?? {}) } as Partial<SignupInput>;
  if (input.funnel !== undefined) {
    if (!isFunnelAnswers(input.funnel)) throw new AccountError("invalid-input");
    const years = funnelBirthYears(input.funnel.age, now.getUTCFullYear());
    if (
      !years ||
      !Number.isInteger(input.birthYear) ||
      Number(input.birthYear) < years.min ||
      Number(input.birthYear) > years.max
    )
      throw new AccountError("invalid-input");
    input.answers = funnelQuizAnswers(input.funnel);
  }
  if (!validSignup(input, now)) throw new AccountError("invalid-input");
  const email = input.email.trim().toLowerCase();
  const start = quizStart(input.answers as never);
  const startMood = Number.isFinite(input.startMood)
    ? Math.max(MOOD_FLOOR, Math.min(100, Math.round(input.startMood as number)))
    : 60;
  return writeTransaction(db, async (tx) => {
    const taken = await tx
      .select({ id: parents.id })
      .from(parents)
      .where(eq(sql`lower(${parents.email})`, email))
      .get();
    if (taken) throw new AccountError("email-taken");
    const familyId = randomUUID();
    const childId = randomUUID();
    await tx.insert(families).values({ id: familyId, plan, version: 0, createdAt: now });
    await tx.insert(parents).values({
      id: randomUUID(),
      familyId,
      email,
      pinHash: hashSecret(input.pin),
      passwordHash: hashSecret(input.password),
    });
    await tx.insert(children).values({
      id: childId,
      familyId,
      name: input.childName.trim(),
      birthYear: input.birthYear,
    });
    await tx
      .insert(wallets)
      .values({ childId, stars: STARTER_STARS + (extras.bonusStars ?? 0), suns: 0 });
    await tx.insert(brainyStates).values({
      childId,
      ...start.stats,
      skills: start.skills,
      mood: startMood,
      startSnapshot: start.stats,
      updatedAt: now,
    });
    const data: Showcase = {
      ...advanceCalendar(personalShowcase(input.childName, start), now).showcase,
      ...(isFunnelAnswers(input.funnel) ? { familyPlan: input.funnel } : {}),
      calendar: {
        timeZone: signupTimeZone(input.timeZone),
        ...calendarKeys(now, signupTimeZone(input.timeZone)),
        bonusGiven: false,
      },
    };
    extras.configure?.(data);
    await tx.insert(showcases).values({ childId, data });
    const access = await issueAccess(tx, childId, now, true);
    return { ...access, child: { id: childId, name: input.childName.trim() }, start };
  });
}

export async function loginParent(db: Database, raw: unknown, now: Date) {
  const input = (raw ?? {}) as { email?: unknown; password?: unknown };
  if (typeof input.email !== "string" || typeof input.password !== "string")
    throw new AccountError("invalid-input");
  const email = input.email.trim().toLowerCase();
  return writeTransaction(db, async (tx) => {
    const parent = await tx
      .select({ familyId: parents.familyId, passwordHash: parents.passwordHash })
      .from(parents)
      .where(eq(sql`lower(${parents.email})`, email))
      .get();
    if (!parent || !secretMatches(input.password as string, parent.passwordHash))
      throw new AccountError("wrong-credentials");
    const child = await tx
      .select({ id: children.id, name: children.name })
      .from(children)
      .where(eq(children.familyId, parent.familyId))
      .get();
    if (!child) throw new LearningStoreError("not-found");
    const access = await issueAccess(tx, child.id, now, true);
    return { ...access, child };
  });
}
