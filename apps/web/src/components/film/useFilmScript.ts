"use client";

import { checkFilm, type FilmScript } from "@brainee/core";
import { FILM_ART, filmScriptUrl, hasFilm } from "@brainee/films";
import { useEffect, useState } from "react";

export type FilmLoad =
  | { status: "none" }
  | { status: "loading" }
  | { status: "failed" }
  | { status: "ready"; script: FilmScript };

/** Loads `/media/films/<id>.json` (own origin) for registered films; validates before use. */
export function useFilmScript(id: string): FilmLoad {
  const [load, setLoad] = useState<FilmLoad>(() =>
    hasFilm(id) ? { status: "loading" } : { status: "none" },
  );
  useEffect(() => {
    if (!hasFilm(id)) return setLoad({ status: "none" });
    let live = true;
    setLoad({ status: "loading" });
    fetch(filmScriptUrl(id))
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((script: unknown) => {
        if (!live) return;
        const broken = checkFilm(script, FILM_ART).some((issue) => issue.level === "error");
        setLoad(broken ? { status: "failed" } : { status: "ready", script: script as FilmScript });
      })
      .catch(() => live && setLoad({ status: "failed" }));
    return () => {
      live = false;
    };
  }, [id]);
  return load;
}
