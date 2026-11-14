export interface PuzzlePicture {
  id: string;
  /** The word spoken when the picture is complete. */
  word: string;
}

/**
 * The bundled pictures (assets/pictures/<id>.png, 1024 × 768), composed from
 * CC0 Kenney art by assets-src/compose_pictures.py.
 */
export const PICTURES: readonly PuzzlePicture[] = [
  { id: "dog", word: "dog" },
  { id: "rabbit", word: "rabbit" },
  { id: "elephant", word: "elephant" },
  { id: "bear", word: "bear" },
  { id: "pig", word: "pig" },
];

export const PICTURE_WIDTH = 1024;
export const PICTURE_HEIGHT = 768;

export const pictureUrl = (picture: PuzzlePicture) => `assets/pictures/${picture.id}.png`;
export const pictureKey = (picture: PuzzlePicture) => `picture:${picture.id}`;
