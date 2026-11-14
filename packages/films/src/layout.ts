import type { FilmIssue, FilmScene, FilmScript, FilmSpot } from "@brainee/core";
import { FILM_BG, FILM_PROPS } from "./art";

/** A box on the 16:9 stage, in % of stage width (x, w) and height (y, h). */
export type Box = { x: number; y: number; w: number; h: number };
const STAGE_RATIO = 16 / 9;
/** Brainy's box on the stage in % (FilmStage: 24% wide, 264×300 viewBox, 2% from the bottom). */
const BRAINY_W = 24;
const BRAINY_H = BRAINY_W * (300 / 264) * STAGE_RATIO;
const SPOT_X: Record<FilmSpot, number> = { left: 4, center: 38, right: 72 };

const pct = (value: unknown) => Number.parseFloat(String(value ?? 0));

/**
 * Where a prop is drawn on a background. Props with a `base` stand on the background's
 * ground line (the point `base` of their 100×100 viewBox touches it); others float at `style.top`.
 */
export function placeProp(key: string, bg?: string): Box | undefined {
  const prop = FILM_PROPS[key];
  if (!prop) return undefined;
  const w = pct(prop.style.width);
  const h = w * STAGE_RATIO;
  const ground = bg === undefined ? undefined : FILM_BG[bg]?.ground;
  const y =
    prop.base !== undefined && ground !== undefined
      ? ground - (prop.base / 100) * h
      : pct(prop.style.top);
  return { x: pct(prop.style.left), y, w, h };
}
/** Floating position, ignoring the background (kept for callers without a scene). */
export const propBox = (key: string) => placeProp(key);

export function brainyBox(spot: FilmSpot): Box {
  return { x: SPOT_X[spot], y: 98 - BRAINY_H, w: BRAINY_W, h: BRAINY_H };
}

/** Share of the smaller box covered by the other one. */
function overlap(a: Box, b: Box) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  if (w <= 0 || h <= 0) return 0;
  return (w * h) / Math.min(a.w * a.h, b.w * b.h);
}

/**
 * Staging problems a viewer would notice: things that stand on the ground shown on a scene
 * without ground (they would hang in the air), and props covering each other or Brainy.
 */
export function filmLayoutIssues(script: FilmScript, limit = 0.34): FilmIssue[] {
  const issues: FilmIssue[] = [];
  script.scenes.forEach((scene: FilmScene, i) => {
    const where = `scenes[${i}]`;
    const ground = FILM_BG[scene.bg]?.ground;
    const boxes = scene.props.map((key) => [key, placeProp(key, scene.bg)] as const);
    const brainy = brainyBox(scene.brainy);
    boxes.forEach(([key, box], j) => {
      if (!box) return;
      const prop = FILM_PROPS[key];
      if (prop?.base !== undefined && !prop.floats && ground === undefined)
        issues.push({
          level: "warning",
          where,
          message: `"${key}" stands on the ground, but "${scene.bg}" has none: it would float`,
        });
      if (overlap(box, brainy) > limit)
        issues.push({
          level: "warning",
          where,
          message: `"${key}" covers Brainy (${scene.brainy})`,
        });
      for (const [other, otherBox] of boxes.slice(j + 1))
        if (otherBox && overlap(box, otherBox) > limit)
          issues.push({ level: "warning", where, message: `"${key}" and "${other}" overlap` });
    });
  });
  return issues;
}
