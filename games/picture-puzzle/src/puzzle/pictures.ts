import type { Locale } from "@brainee/game-bridge";

export interface PuzzlePicture {
  id: string;
  /** The word spoken when the picture is complete. */
  word: Record<Locale, string>;
}

/**
 * The bundled pictures (assets/pictures/<id>.png, 1024 × 768), composed from
 * CC0 Kenney art by assets-src/compose_pictures.py.
 */
export const PICTURES: readonly PuzzlePicture[] = [
  { id: "dog", word: { en: "dog", ru: "собака", kk: "ит" } },
  { id: "rabbit", word: { en: "rabbit", ru: "заяц", kk: "қоян" } },
  { id: "elephant", word: { en: "elephant", ru: "слон", kk: "піл" } },
  { id: "bear", word: { en: "bear", ru: "медведь", kk: "аю" } },
  { id: "pig", word: { en: "pig", ru: "свинья", kk: "шошқа" } },
];

export const PICTURE_WIDTH = 1024;
export const PICTURE_HEIGHT = 768;

export const pictureUrl = (picture: PuzzlePicture) => `assets/pictures/${picture.id}.png`;
export const pictureKey = (picture: PuzzlePicture) => `picture:${picture.id}`;
