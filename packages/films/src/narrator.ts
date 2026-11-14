import type { FilmSpot, FilmVoice } from "@brainee/core";
import type { ReactNode } from "react";

/** What the narrator slot tells the mascot at each frame. */
export type FilmNarratorState = {
  /** 0–1 mouth opening from the voice level; 0 while silent or while a guest speaks. */
  talk: number;
  /** Who is speaking now, if anyone. */
  voice?: FilmVoice;
  /** Where the narrator stands in this scene. */
  spot: FilmSpot;
};
/**
 * The replaceable mascot. It draws into a box 24% of the stage wide with a 264×300 aspect
 * (Brainy's viewBox), standing 2% above the bottom; the film never depends on who it is.
 */
export type FilmNarrator = (state: FilmNarratorState) => ReactNode;

/** Narrator's box: width in % of the stage and its width:height aspect. */
export const NARRATOR_BOX = { width: 24, aspect: 264 / 300, bottom: 2 } as const;
