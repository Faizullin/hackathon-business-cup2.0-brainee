import { applyStatGains, BODY_STATS, moodAfterGame } from "./brainy";
import { completeLearningGame, type LearningStreak, sessionStars, stopForToday } from "./economy";
import { ABILITY_BODY } from "./stat-gains";
import type { Ability, BrainyStats, GameKind, GameResult, Skill, Wallet } from "./types";

export type LearningProgress = {
  stats: BrainyStats;
  wallet: Wallet;
  mood: number;
  streak: LearningStreak;
};

/** Prototype calibration until a specialist supplies the session-gain policy (T-24). */
export function prototypeStatGains(gameId: string): Partial<BrainyStats> {
  if (gameId === "odd-one-out") return { eyes: 3 };
  if (gameId === "continue-pattern") return { brain: 2 };
  throw new RangeError("No learning gain policy exists for this game.");
}

export function isLearningProgress(value: unknown): value is LearningProgress {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<LearningProgress>;
  const count = (n: unknown) => typeof n === "number" && Number.isSafeInteger(n) && n >= 0;
  const stat = (n: unknown) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 100;
  return (
    !!p.stats &&
    [...BODY_STATS, "resp" as const].every((key) => stat(p.stats?.[key])) &&
    !!p.wallet &&
    count(p.wallet.stars) &&
    count(p.wallet.suns) &&
    stat(p.mood) &&
    !!p.streak &&
    count(p.streak.inRow) &&
    typeof p.streak.bonusGiven === "boolean"
  );
}

/** Pure transition. The host validates the issued session and owns persistence. */
export function finishLearningSession(before: LearningProgress, result: GameResult) {
  if (!isLearningProgress(before)) throw new RangeError("Invalid learning progress.");
  const stats = applyStatGains(before.stats, prototypeStatGains(result.gameId));
  const step = completeLearningGame(before.streak);
  const gameStars = sessionStars(result);
  const earnedStars = gameStars + step.bonus;
  const stars = before.wallet.stars + earnedStars;
  if (!Number.isSafeInteger(stars)) throw new RangeError("Star balance is too large.");
  const gains = Object.fromEntries(
    BODY_STATS.filter((key) => stats[key] !== before.stats[key]).map((key) => [
      key,
      stats[key] - before.stats[key],
    ]),
  ) as Partial<BrainyStats>;
  const after: LearningProgress = {
    stats,
    wallet: { ...before.wallet, stars },
    mood: moodAfterGame(before.mood),
    streak: step.streak,
  };
  return {
    before,
    after,
    gains,
    gameStars,
    earnedStars,
    bonus: step.bonus,
    suggestBreak: step.suggestBreak,
  };
}

export type LearningCompletion = ReturnType<typeof finishLearningSession>;
export const stopLearningSession = (progress: LearningProgress): LearningProgress => ({
  ...progress,
  streak: stopForToday(progress.streak),
});

/** Available-game fallback without invented age norms. T-25 takes real averages separately. */
export function practiceGame<T extends { id: string; kind: GameKind; skills: { main: Skill } }>(
  stats: BrainyStats,
  games: readonly T[],
): T | undefined {
  return games
    .filter((game) => game.kind === "dev" && game.skills.main in ABILITY_BODY)
    .slice()
    .sort(
      (a, b) =>
        stats[ABILITY_BODY[a.skills.main as Ability]] -
          stats[ABILITY_BODY[b.skills.main as Ability]] || a.id.localeCompare(b.id),
    )[0];
}
