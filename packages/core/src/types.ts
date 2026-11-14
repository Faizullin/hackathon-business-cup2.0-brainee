// Shared, framework-free types. Product spec: docs/product/mechanics.md.

/** 6 abilities (skill radar) + 5 character traits + fun-game skills. */
export const ABILITIES = ["speech", "reading", "logic", "attention", "memory", "motor"] as const;
export const TRAITS = [
  "longGame",
  "learningMachine",
  "doHardThing",
  "learningFromMistakes",
  "responsibility",
] as const;
export const FUN_SKILLS = ["spatial", "reaction", "rhythm", "accuracy", "dexterity"] as const;

export type Ability = (typeof ABILITIES)[number];
export type Trait = (typeof TRAITS)[number];
export type FunSkill = (typeof FUN_SKILLS)[number];
export type Skill = Ability | Trait | FunSkill;

export type GameKind = "dev" | "fun";

/** What every game reports when a session ends. Untrusted input until validated (T-81). */
export type GameResult = {
  gameId: string;
  level: number;
  rounds: number;
  /** Wrong answers in total. */
  mistakes: number;
  /** Rounds solved after at least one mistake. */
  corrections: number;
  durationMs: number;
};

export type RoundEvent = { correct: boolean; afterMistake: boolean };

export type BodyStat = "brain" | "eyes" | "mouth" | "arms" | "legs";
export type BrainyStats = Record<BodyStat | "resp", number>;

export type Wallet = { stars: number; suns: number };
