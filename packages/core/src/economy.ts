// ★/☀ economy rules. Spec: docs/product/mechanics.md#two-currencies.
import type { GameResult, RoundEvent, Wallet } from "./types";

export const STAR_RULES = {
  firstTry: 3,
  corrected: 4,
  popsciCorrect: 15,
  streakBonus: 5,
  streakLength: 3,
} as const;

export const SUN_TO_STARS = 10;

const isCount = (value: number) => Number.isInteger(value) && value >= 0;

/** Stars for one answer: only correct answers earn, a correction earns more. */
export function roundStars({ correct, afterMistake }: RoundEvent): number {
  if (!correct) return 0;
  return afterMistake ? STAR_RULES.corrected : STAR_RULES.firstTry;
}

/** Stars for a finished learning session; every round is eventually solved. */
export function sessionStars({ rounds, corrections }: Pick<GameResult, "rounds" | "corrections">) {
  if (!isCount(rounds) || !isCount(corrections) || corrections > rounds) {
    throw new RangeError("rounds and corrections must be counts with corrections <= rounds.");
  }
  return (rounds - corrections) * STAR_RULES.firstTry + corrections * STAR_RULES.corrected;
}

/** Learning games played in a row; the bonus is paid once per streak state. */
export type LearningStreak = { inRow: number; bonusGiven: boolean };

export const newStreak = (): LearningStreak => ({ inRow: 0, bonusGiven: false });

export function completeLearningGame(streak: LearningStreak) {
  const inRow = streak.inRow + 1;
  const earnsBonus = inRow >= STAR_RULES.streakLength && !streak.bonusGiven;
  return {
    streak: { inRow, bonusGiven: streak.bonusGiven || earnsBonus },
    bonus: earnsBonus ? STAR_RULES.streakBonus : 0,
    suggestBreak: inRow >= STAR_RULES.streakLength,
  };
}

/** "Хватит на сегодня" / taking a break ends the run of games. */
export const stopForToday = (streak: LearningStreak): LearningStreak => ({ ...streak, inRow: 0 });

export type WalletChange =
  | { ok: true; wallet: Wallet }
  | { ok: false; reason: "invalid-amount" | "not-enough-suns" };

function assertWallet(wallet: Wallet) {
  if (!isCount(wallet.stars) || !isCount(wallet.suns)) {
    throw new RangeError("Wallet balances must be nonnegative integers.");
  }
}

/** One-way exchange: 1☀ → 10★. Stars can never become suns. */
export function exchangeSuns(wallet: Wallet, suns: number): WalletChange {
  assertWallet(wallet);
  if (!Number.isInteger(suns) || suns <= 0) return { ok: false, reason: "invalid-amount" };
  if (suns > wallet.suns) return { ok: false, reason: "not-enough-suns" };
  return {
    ok: true,
    wallet: { stars: wallet.stars + suns * SUN_TO_STARS, suns: wallet.suns - suns },
  };
}

/** Real gifts cost suns only. */
export function buyGift(wallet: Wallet, priceSuns: number): WalletChange {
  assertWallet(wallet);
  if (!Number.isInteger(priceSuns) || priceSuns <= 0)
    return { ok: false, reason: "invalid-amount" };
  if (priceSuns > wallet.suns) return { ok: false, reason: "not-enough-suns" };
  return { ok: true, wallet: { stars: wallet.stars, suns: wallet.suns - priceSuns } };
}
