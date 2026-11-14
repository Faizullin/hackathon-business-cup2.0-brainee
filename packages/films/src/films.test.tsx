// `pnpm check:films`: every film in apps/web/public/media/films against docs/dev/films.md.
// Errors fail the run; warnings are printed and must be fixed or explained in the handoff.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { checkFilm, type FilmScript, filmMinutes, filmSceneAt } from "@brainee/core";
import { demoShowcase } from "@brainee/db/seed";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FILM_BG, FILM_PROPS } from "./art";
import { FilmStage } from "./FilmStage";
import { FILM_ART, FILM_IDS, type FilmNarrator, filmLayoutIssues, placeProp } from "./index";
import { FILM_MOTIONS, GROUND_MOTIONS } from "./motion";

const DIR = join(import.meta.dirname, "../../../apps/web/public/media/films");
const MAX_MP3_BYTES = 15 * 1024 * 1024;
/** Any mascot fits the narrator slot; tests use a plain stub. */
const mascot: FilmNarrator = ({ talk, voice, spot }) => (
  <svg aria-hidden="true" viewBox="0 0 264 300" data-mascot={`${spot}:${voice ?? "-"}:${talk}`} />
);
const ids = existsSync(DIR)
  ? readdirSync(DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.slice(0, -5))
  : [];

function probeSeconds(path: string) {
  try {
    const out = execFileSync(
      "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
      { encoding: "utf8" },
    );
    return Number.parseFloat(out);
  } catch {
    return undefined; // ffprobe is optional; duration is then trusted from the script
  }
}

describe("film art", () => {
  it.each(Object.keys(FILM_PROPS))("prop %s is self-contained and placed in %", (key) => {
    const prop = FILM_PROPS[key];
    expect(FILM_MOTIONS).toContain(prop?.cls);
    for (const side of ["left", "top", "width"] as const)
      expect(String(prop?.style[side])).toMatch(/^\d+(\.\d+)?%$/);
    const svg = renderToStaticMarkup(
      <svg aria-hidden="true" viewBox="0 0 100 100">
        {prop?.svg}
      </svg>,
    );
    expect(svg).not.toMatch(/https?:|<image|<foreignObject|href=/);
  });
  it.each(Object.keys(FILM_BG))("background %s is self-contained", (key) => {
    const svg = renderToStaticMarkup(
      <svg aria-hidden="true" viewBox="0 0 160 90">
        {FILM_BG[key]?.svg}
      </svg>,
    );
    expect(svg).not.toMatch(/https?:|<image|<foreignObject|href=/);
  });
});

describe("grounded props", () => {
  const grounded = Object.keys(FILM_PROPS).filter((key) => FILM_PROPS[key]?.base !== undefined);
  const withGround = Object.keys(FILM_BG).filter((key) => FILM_BG[key]?.ground !== undefined);
  it.each(grounded)("%s stands exactly on every ground line, inside the stage", (key) => {
    const base = FILM_PROPS[key]?.base ?? 0;
    for (const bg of withGround) {
      const box = placeProp(key, bg);
      expect(box).toBeDefined();
      if (!box) continue;
      expect(box.y + (base / 100) * box.h).toBeCloseTo(FILM_BG[bg]?.ground ?? 0, 5);
      expect(box.y).toBeGreaterThanOrEqual(0);
    }
  });
  it("props that only stand never use a floating motion", () => {
    for (const key of grounded.filter((k) => !FILM_PROPS[k]?.floats))
      expect(GROUND_MOTIONS, key).toContain(FILM_PROPS[key]?.cls);
  });
  it("a standing rocket is drawn still; in space it floats", () => {
    const html = (bg: string) =>
      renderToStaticMarkup(
        <FilmStage
          scene={{ t: 0, bg, props: ["rocket", "cloud"], brainy: "left" }}
          narrator={mascot}
        />,
      );
    expect(html("yard")).toContain("film-still");
    expect(html("space")).toContain("film-bob");
  });
});

describe("replaceable narrator", () => {
  const scene = { t: 0, bg: "yard", props: ["sun", "cloud"], brainy: "right" as const };
  it("draws whatever mascot the player passes, with talk, voice and spot", () => {
    const html = renderToStaticMarkup(
      <FilmStage
        scene={scene}
        caption={{ t: 0, end: 2, text: "Hi!", who: "brainy" }}
        talk={0.6}
        narrator={mascot}
      />,
    );
    expect(html).toContain('data-mascot="right:brainy:0.6"');
    expect(html).toContain("data-narrator");
  });
  it("tells the mascot who speaks, and works with no narrator at all", () => {
    const guest = renderToStaticMarkup(
      <FilmStage
        scene={scene}
        caption={{ t: 0, end: 2, text: "Hi", who: "guest" }}
        narrator={mascot}
      />,
    );
    expect(guest).toContain('data-mascot="right:guest:0"');
    const empty = renderToStaticMarkup(<FilmStage scene={scene} />);
    expect(empty).not.toContain("data-narrator");
    expect(empty).toContain('data-prop="sun"');
  });
});

it("FILM_IDS lists exactly the films on disk", () => {
  expect([...FILM_IDS].sort()).toEqual([...ids].sort());
});

describe.each(ids)("film %s", (id) => {
  const script = JSON.parse(readFileSync(join(DIR, `${id}.json`), "utf8")) as FilmScript;
  const issues = [...checkFilm(script, FILM_ART), ...filmLayoutIssues(script)];
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");

  it("passes the script rules", () => {
    for (const w of warnings) console.warn(`⚠ ${id} ${w.where}: ${w.message}`);
    expect(errors.map((e) => `${e.where}: ${e.message}`)).toEqual([]);
    // A ground object on a scene without ground hangs in the air: never acceptable.
    expect(warnings.filter((w) => w.message.includes("would float"))).toEqual([]);
    expect(script.id).toBe(id);
    console.log(
      `✓ ${id}: ${script.questions.length} questions, ${script.scenes.length} scenes, ` +
        `${warnings.length} warnings`,
    );
  });

  it("ships its own mp3 under 15 MB with the scripted duration", () => {
    const mp3 = join(DIR, `${id}.mp3`);
    expect(existsSync(mp3)).toBe(true);
    expect(statSync(mp3).size).toBeLessThanOrEqual(MAX_MP3_BYTES);
    const seconds = probeSeconds(mp3);
    if (seconds !== undefined) expect(Math.abs(seconds - script.duration)).toBeLessThan(0.5);
  });

  it("has a matching science catalog entry", () => {
    const entry = demoShowcase.science.find((v) => v.id === id);
    expect(entry, `add "${id}" to packages/db/src/showcase-seed.ts science`).toBeDefined();
    expect(entry?.minutes).toBe(filmMinutes(script));
  });

  it("renders every scene", () => {
    for (const scene of script.scenes) {
      const html = renderToStaticMarkup(
        <FilmStage scene={filmSceneAt(script, scene.t)} narrator={mascot} />,
      );
      expect(html).toContain(`data-bg="${scene.bg}"`);
    }
  });
});
