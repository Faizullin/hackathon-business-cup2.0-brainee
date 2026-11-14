import { ABILITIES, type Ability, type GameKind, type Skill } from "./types";

export type AbilityScores = Record<Ability, number>;
export type PlayedGame = { gameId: string; finishedAt: number };
type Candidate = { id: string; kind: GameKind; skills: { main: Skill; secondary?: Skill } };
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const byId = (a: Candidate, b: Candidate) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** Up to three distinct playable games. The caller supplies approved age averages and time. */
export function recommendGames<T extends Candidate>(
  scores: AbilityScores,
  ageAverages: AbilityScores,
  games: readonly T[],
  history: readonly PlayedGame[],
  now: number,
) {
  if (
    !Number.isFinite(now) ||
    !ABILITIES.every((skill) =>
      [scores[skill], ageAverages[skill]].every(
        (value) => Number.isFinite(value) && value >= 0 && value <= 100,
      ),
    )
  )
    throw new RangeError("Recommendations need complete scores, age averages and a valid time.");
  const counts = new Map<string, number>();
  for (const session of history) {
    if (!Number.isFinite(session.finishedAt)) throw new RangeError("Invalid session timestamp.");
    if (session.finishedAt >= now - WEEK_MS && session.finishedAt <= now)
      counts.set(session.gameId, (counts.get(session.gameId) ?? 0) + 1);
  }
  const gaps = ABILITIES.map((skill) => ({
    skill,
    score: scores[skill],
    ageAverage: ageAverages[skill],
    gap: scores[skill] - ageAverages[skill],
  }))
    .sort((a, b) => a.gap - b.gap)
    .slice(0, 3);
  const used = new Set<string>();
  return gaps.flatMap((gap) => {
    const game = games
      .filter(
        (game) =>
          game.kind === "dev" &&
          !used.has(game.id) &&
          (game.skills.main === gap.skill || game.skills.secondary === gap.skill),
      )
      .sort(
        (a, b) =>
          (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0) ||
          Number(b.skills.main === gap.skill) - Number(a.skills.main === gap.skill) ||
          byId(a, b),
      )[0];
    if (!game) return [];
    used.add(game.id);
    return [{ ...gap, game, playedLast7Days: counts.get(game.id) ?? 0 }];
  });
}
