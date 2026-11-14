import { ABILITIES, type Ability, type BrainyStats, type GameResult, type Skill } from "./types";

export const ABILITY_BODY = {
  speech: "mouth",
  reading: "mouth",
  logic: "brain",
  attention: "eyes",
  memory: "brain",
  motor: "arms",
} as const satisfies Record<Ability, keyof BrainyStats>;

/** A specialist supplies the level/accuracy calibration; there is no invented default. */
export type SessionGainPolicy = (result: Readonly<GameResult>) => number;

/** Split a session's gain budget 70/30; one distinct skill gets the whole budget. */
export function sessionSkillGains(
  result: GameResult,
  trained: { main: Skill; secondary?: Skill },
  policy: SessionGainPolicy,
): Partial<Record<Skill, number>> {
  const count = (n: number) => Number.isSafeInteger(n) && n >= 0;
  if (
    !count(result.level) ||
    result.level === 0 ||
    !count(result.rounds) ||
    result.rounds === 0 ||
    !count(result.mistakes) ||
    !count(result.corrections) ||
    result.corrections > result.rounds ||
    result.corrections > result.mistakes ||
    !Number.isFinite(result.durationMs) ||
    result.durationMs < 0
  )
    throw new RangeError("Invalid completed learning session.");
  const total = policy({ ...result });
  if (!Number.isFinite(total) || total < 0)
    throw new RangeError("Gain policy must return a finite nonnegative budget.");
  if (!trained.secondary || trained.main === trained.secondary) return { [trained.main]: total };
  return { [trained.main]: total * 0.7, [trained.secondary]: total * 0.3 };
}

/** Ability gains roll up into body parts; trait/fun-skill mappings remain product TBDs. */
export function abilityStatGains(gains: Partial<Record<Ability, number>>): Partial<BrainyStats> {
  const body: Partial<BrainyStats> = {};
  for (const ability of ABILITIES) {
    const gain = gains[ability];
    if (gain === undefined) continue;
    if (!Number.isFinite(gain) || gain < 0) throw new RangeError("Invalid ability gain.");
    const part = ABILITY_BODY[ability];
    body[part] = (body[part] ?? 0) + gain;
  }
  return body;
}

// D-23: every learning game declares its own skill weights (summing to 1). A completed
// session earns a budget from level and accuracy, split by those weights.
export type SkillWeights = Partial<Record<Ability, number>>;
export type SkillScores = Record<Ability, number>;
export const SESSION_BASE_GAIN = 3;

export function isSkillWeights(value: unknown): value is SkillWeights {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return false;
  let sum = 0;
  for (const [key, weight] of entries) {
    if (!(ABILITIES as readonly string[]).includes(key)) return false;
    if (typeof weight !== "number" || !(weight > 0) || weight > 1) return false;
    sum += weight;
  }
  return Math.abs(sum - 1) < 1e-6;
}

export function isSkillScores(value: unknown): value is SkillScores {
  if (!value || typeof value !== "object") return false;
  return ABILITIES.every((skill) => {
    const n = (value as Record<string, unknown>)[skill];
    return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 100;
  });
}

/** Budget: base + 1 per level above 1, scaled 50–100% by first-try accuracy. */
export function sessionBudget(result: Pick<GameResult, "level" | "rounds" | "corrections">) {
  const accuracy = result.rounds > 0 ? (result.rounds - result.corrections) / result.rounds : 0;
  return (SESSION_BASE_GAIN + Math.max(0, result.level - 1)) * (0.5 + 0.5 * accuracy);
}

/** Whole-point ability gains for one completed session (zeros dropped). */
export function weightedSkillGains(
  result: Pick<GameResult, "level" | "rounds" | "corrections">,
  weights: SkillWeights,
): Partial<Record<Ability, number>> {
  if (!isSkillWeights(weights)) throw new RangeError("Invalid skill weights.");
  const budget = sessionBudget(result);
  const gains: Partial<Record<Ability, number>> = {};
  for (const ability of ABILITIES) {
    const weight = weights[ability];
    if (!weight) continue;
    const gain = Math.round(budget * weight);
    if (gain > 0) gains[ability] = gain;
  }
  return gains;
}

export function applySkillGains(scores: SkillScores, gains: Partial<Record<Ability, number>>) {
  const next = { ...scores };
  for (const ability of ABILITIES) {
    const gain = gains[ability];
    if (gain) next[ability] = Math.min(100, Math.max(0, next[ability] + gain));
  }
  return next;
}
