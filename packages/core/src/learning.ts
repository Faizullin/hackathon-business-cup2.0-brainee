import { applyStatGains, BODY_STATS, moodAfterGame } from "./brainy";
import { completeLearningGame, type LearningStreak, sessionStars, stopForToday } from "./economy";
import {
  ABILITY_BODY,
  abilityStatGains,
  applySkillGains,
  isSkillScores,
  type SkillScores,
  type SkillWeights,
  weightedSkillGains,
} from "./stat-gains";
import type { Ability, BrainyStats, GameKind, GameResult, Skill, Wallet } from "./types";

export type LearningProgress = {
  stats: BrainyStats;
  /** The six ability scores (0–100) that roll up into Brainy's body (D-23). */
  skills: SkillScores;
  wallet: Wallet;
  mood: number;
  streak: LearningStreak;
};

export function isLearningProgress(value: unknown): value is LearningProgress {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<LearningProgress>;
  const count = (n: unknown) => typeof n === "number" && Number.isSafeInteger(n) && n >= 0;
  const stat = (n: unknown) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 100;
  return (
    !!p.stats &&
    [...BODY_STATS, "resp" as const].every((key) => stat(p.stats?.[key])) &&
    isSkillScores(p.skills) &&
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
export function finishLearningSession(
  before: LearningProgress,
  result: GameResult,
  weights: SkillWeights,
) {
  if (!isLearningProgress(before)) throw new RangeError("Invalid learning progress.");
  // D-23: the game's weights split the session budget across abilities, which roll up to the body.
  const skillGains = weightedSkillGains(result, weights);
  const skills = applySkillGains(before.skills, skillGains);
  const stats = applyStatGains(before.stats, abilityStatGains(skillGains));
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
    skills,
    wallet: { ...before.wallet, stars },
    mood: moodAfterGame(before.mood),
    streak: step.streak,
  };
  return {
    before,
    after,
    gains,
    skillGains,
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

/** Brainy's advice must stay in learning, even when motor/reaction is weaker. */
export function learningPracticeGame<
  T extends { id: string; kind: GameKind; skills: { main: Skill } },
>(stats: BrainyStats, games: readonly T[]) {
  return practiceGame(
    stats,
    games.filter((g) =>
      ["brain", "eyes", "mouth"].includes(ABILITY_BODY[g.skills.main as Ability]),
    ),
  );
}
