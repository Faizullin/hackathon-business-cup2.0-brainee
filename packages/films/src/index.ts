export { FILM_BG, FILM_PROPS, type FilmBackground, type FilmProp, PALETTE } from "./art";
export { FILM_IDS, hasFilm } from "./catalog";
export { FilmStage } from "./FilmStage";
export { type Box, brainyBox, filmLayoutIssues, placeProp, propBox } from "./layout";
export { FILM_CSS, FILM_MOTIONS, type FilmMotion, GROUND_MOTIONS } from "./motion";
export { type FilmNarrator, type FilmNarratorState, NARRATOR_BOX } from "./narrator";

import { FILM_BG, FILM_PROPS } from "./art";
/** Keys a script may use; pass to `checkFilm` from @brainee/core. */
export const FILM_ART = { bg: Object.keys(FILM_BG), props: Object.keys(FILM_PROPS) };
/** Where films are served from (apps/web/public/media/films). */
export const filmScriptUrl = (id: string) => `/media/films/${id}.json`;
