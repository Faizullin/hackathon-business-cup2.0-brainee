"use client";

import { BRAINY_PRESETS } from "@brainee/brainy";
import { checkFilm, type FilmIssue, type FilmScript } from "@brainee/core";
import { FILM_ART, FILM_IDS, filmLayoutIssues } from "@brainee/films";
import { useEffect, useState } from "react";
import { FilmView } from "@/components/film/FilmView";
import { useFilmScript } from "@/components/film/useFilmScript";
import { ru } from "@/i18n/ru";

type Local = { script: FilmScript | null; issues: FilmIssue[]; audio?: string };

function issuesOf(value: unknown): FilmIssue[] {
  const issues = checkFilm(value, FILM_ART);
  return issues.some((i) => i.level === "error")
    ? issues
    : [...issues, ...filmLayoutIssues(value as FilmScript)];
}

// Dev-only film studio: play any shipped film with seeking, or try local mp3 + JSON drafts.
export function FilmLab() {
  const t = ru.lab.film;
  const [id, setId] = useState<string>(FILM_IDS[0]);
  const shipped = useFilmScript(id);
  const [local, setLocal] = useState<Local | null>(null);
  useEffect(() => () => void (local?.audio && URL.revokeObjectURL(local.audio)), [local?.audio]);

  const loadScript = async (file?: File) => {
    if (!file) return;
    try {
      const value: unknown = JSON.parse(await file.text());
      const issues = issuesOf(value);
      const ok = !issues.some((i) => i.level === "error");
      setLocal((l) => ({ audio: l?.audio, script: ok ? (value as FilmScript) : null, issues }));
    } catch {
      setLocal((l) => ({
        audio: l?.audio,
        script: null,
        issues: [{ level: "error", where: "file", message: t.badJson }],
      }));
    }
  };
  const loadAudio = (file?: File) => {
    if (!file) return;
    setLocal((l) => ({
      script: l?.script ?? null,
      issues: l?.issues ?? [],
      audio: URL.createObjectURL(file),
    }));
  };

  const script = local?.script ?? (shipped.status === "ready" ? shipped.script : null);
  const audio = local?.script ? local.audio : script?.audio;
  const issues = local ? local.issues : script ? issuesOf(script) : [];
  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-3">
        <h2>{t.title}</h2>
        {script && audio && (
          <FilmView
            key={`${script.id}-${audio}`}
            script={script}
            src={audio}
            stats={BRAINY_PRESETS.now}
            studio
          />
        )}
      </div>
      <aside className="flex min-w-0 flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          {t.pick}
          <select
            value={id}
            onChange={(e) => {
              setLocal(null);
              setId(e.target.value);
            }}
            className="min-h-12 rounded-xl border border-border bg-card px-3"
          >
            {FILM_IDS.map((film) => (
              <option key={film}>{film}</option>
            ))}
          </select>
        </label>
        <fieldset className="flex min-w-0 flex-col gap-2 rounded-xl border border-border p-3 text-sm">
          <legend>{t.files}</legend>
          <label className="flex flex-col gap-1">
            {t.audio}
            <input
              type="file"
              className="w-full min-w-0 text-sm"
              accept="audio/mpeg"
              onChange={(e) => loadAudio(e.target.files?.[0])}
            />
          </label>
          <label className="flex flex-col gap-1">
            {t.script}
            <input
              type="file"
              className="w-full min-w-0 text-sm"
              accept="application/json"
              onChange={(e) => loadScript(e.target.files?.[0])}
            />
          </label>
        </fieldset>
        <div className="flex flex-col gap-2 text-sm" data-testid="film-issues">
          <h3 className="font-semibold">{t.issues}</h3>
          {issues.length === 0 ? (
            <p>{t.clean}</p>
          ) : (
            <ul className="flex max-h-80 flex-col gap-1 overflow-auto">
              {issues.map((issue) => (
                <li
                  key={`${issue.where}-${issue.message}`}
                  className={issue.level === "error" ? "text-coral" : "text-muted-foreground"}
                >
                  {issue.level === "error" ? "✕" : "⚠"} {issue.where}: {issue.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </section>
  );
}
