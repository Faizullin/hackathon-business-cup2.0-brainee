/**
 * Films that ship in apps/web/public/media/films (<id>.mp3 + <id>.json). The player only
 * fetches scripts listed here; `pnpm check:films` keeps this list and the folder in sync.
 */
export const FILM_IDS = ["sky-blue", "rain", "sun-goes"] as const;

export const hasFilm = (id: string) => (FILM_IDS as readonly string[]).includes(id);
