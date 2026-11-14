import type { GameResult } from "./types";

export type LearningGameRules = { id: string; levels: number; roundsPerSession: number };
export type LearningLaunch = { gameId: string; level: number; seed?: number };
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const count = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const levelMatches = (value: unknown, game: LearningGameRules): value is number =>
  count(value) && value >= 1 && value <= game.levels;

/** Catalog-bound input; identity, rewards and stat deltas never come from a game. */
export function parseLearningLaunch(
  value: unknown,
  game: LearningGameRules,
): LearningLaunch | null {
  if (
    !record(value) ||
    Object.keys(value).some((key) => !["gameId", "level", "seed"].includes(key)) ||
    value.gameId !== game.id ||
    !levelMatches(value.level, game)
  )
    return null;
  if (value.seed !== undefined && (!count(value.seed) || value.seed > 0xffffffff)) return null;
  return {
    gameId: game.id,
    level: value.level,
    ...(value.seed === undefined ? {} : { seed: value.seed as number }),
  };
}

/** Structural validation, not proof of play. The server also checks its issued session. */
export function parseLearningGameResult(
  value: unknown,
  game: LearningGameRules,
): GameResult | null {
  if (
    !record(value) ||
    Object.keys(value).length !== 6 ||
    Object.keys(value).some(
      (key) =>
        !["gameId", "level", "rounds", "mistakes", "corrections", "durationMs"].includes(key),
    )
  )
    return null;
  if (
    value.gameId !== game.id ||
    !levelMatches(value.level, game) ||
    value.rounds !== game.roundsPerSession ||
    !count(value.mistakes) ||
    !count(value.corrections) ||
    value.corrections > game.roundsPerSession ||
    value.corrections > value.mistakes ||
    (value.mistakes === 0) !== (value.corrections === 0) ||
    !count(value.durationMs)
  )
    return null;
  return {
    gameId: game.id,
    level: value.level,
    rounds: game.roundsPerSession,
    mistakes: value.mistakes,
    corrections: value.corrections,
    durationMs: value.durationMs,
  };
}
