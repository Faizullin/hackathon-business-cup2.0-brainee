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
