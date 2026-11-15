import { randomBytes, randomUUID } from "node:crypto";
import {
  funnelBirthYears,
  grantStarterPack,
  STARTER_STARS,
  type StartRequest,
} from "@brainee/core";
import { DEMO_PIN, signupFromQuiz } from "./account-store";
import type { Database } from "./client";

/** Funnel gift tiles mapped to the seeded gift ids; "later" keeps the default weekly reward. */
const GIFT_IDS: Record<string, string> = { ice: "icecream", movie: "cinema", park: "park" };
export const FALLBACK_CHILD_NAME = "Your kid";

/**
 * One-tap start (D-41): a funnel family with generated login credentials, no forms and no payment.
 * The Brainy starts at the funnel's health score; the Starter Pack is only granted when asked.
 */
export async function createFunnelFamily(db: Database, request: StartRequest, now: Date) {
  const credentials = {
    email: `family-${randomUUID()}@brainee.example`,
    password: randomBytes(9).toString("base64url"),
    pin: DEMO_PIN,
  };
  const years = funnelBirthYears(request.birthBand, now.getUTCFullYear());
  if (!years) throw new RangeError("Unsupported age band.");
  const { draft } = request;
  const access = await signupFromQuiz(
    db,
    {
      ...credentials,
      childName: request.childName || FALLBACK_CHILD_NAME,
      birthYear: Math.floor((years.min + years.max) / 2),
      answers: request.quiz,
      funnel: request.familyPlan,
      timeZone: "America/New_York",
      startMood: request.startMood,
    },
    now,
    "demo",
    {
      bonusStars: request.starterPack ? STARTER_STARS : 0,
      configure: (showcase) => {
        showcase.startPlan = {
          plan: request.plan,
          gift: draft.gift ?? "later",
          minutes: Number(draft.minutes ?? 15),
          ...(draft.earn === undefined ? {} : { earn: draft.earn }),
          ...(request.email ? { contactEmail: request.email } : {}),
        };
        const gift = showcase.gifts.find((g) => g.id === GIFT_IDS[draft.gift ?? ""]);
        if (gift) showcase.weekGoal = { ...showcase.weekGoal, giftId: gift.id, target: gift.price };
        if (request.starterPack) grantStarterPack(showcase);
      },
    },
  );
  return { ...access, credentials };
}
