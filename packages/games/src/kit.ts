// The one contract every game implements. Guide: docs/dev/games.md.
import type { GameKind, GameResult, RoundEvent, Skill, SkillWeights } from "@brainee/core";
import type { ComponentType } from "react";

/** Hosts supply localized strings; isolated games never import an application. */
export type GameText = {
  loading: string;
  loadError: string;
  runtimeError: string;
  round(current: number, total: number): string;
  shape(index: number): string;
  choice(index: number): string;
  correct(stars: number, corrected: boolean): string;
  oddInstruction: string;
  patternInstruction: string;
  sequence: string;
  missingShape: string;
  almost: string;
  completed: string;
  done: string;
  next: string;
};

export type GameProps = {
  locale?: "en";
  level: number;
  /** Deterministic rounds: same seed → same game. */
  seed: number;
  text: GameText;
  /** UI feedback + analytics only; rewards are granted by core on the server. */
  onRound(event: RoundEvent): void;
  onFinish(result: GameResult): void;
};

export type GameMeta = {
  id: string;
  version: string;
  kind: GameKind;
  /** English catalog title; callers localize for display. */
  title: string;
  skills: { main: Skill; secondary?: Skill };
  /** D-23: this game's share of each trained ability (sums to 1); mirrors the Game row. */
  weights: SkillWeights;
  /** D-22: recommended minimum age; the catalog spans 4–10. */
  minAge: number;
  levels: number;
  roundsPerSession: number;
};

export type ReactGameModule = { default: ComponentType<GameProps> };

export type GameDefinition = GameMeta &
  (
    | { runtime: "react"; load: () => Promise<ReactGameModule> }
    /** Iframe + bridge runtime arrives with T-29; runtimeUrl comes from the Game table. */
    | { runtime: "embedded"; runtimeUrl: string }
  );

export const clampLevel = (level: number, levels: number) =>
  Math.min(Math.max(1, Math.trunc(level) || 1), levels);
