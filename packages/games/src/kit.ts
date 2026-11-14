// The one contract every game implements. Guide: docs/dev/games.md.
import type { GameKind, GameResult, RoundEvent, Skill } from "@brainee/core";
import type { ComponentType } from "react";

/** Hosts supply localized strings; isolated games never import an application. */
export type GameText = {
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
  kind: GameKind;
  /** Russian UI title. */
  title: string;
  skills: { main: Skill; secondary?: Skill };
  levels: number;
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
