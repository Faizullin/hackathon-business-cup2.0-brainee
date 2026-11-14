import type { FilmIssue, FilmScene, FilmScript, FilmSpot } from "@brainee/core";
import { FILM_PROPS } from "./art";

type Box = { x: number; y: number; w: number; h: number };
const STAGE_RATIO = 16 / 9;
/** Brainy's box on the stage in % (FilmStage: 24% wide, 264×300 viewBox, 2% from the bottom). */
const BRAINY_W = 24;
const BRAINY_H = BRAINY_W * (300 / 264) * STAGE_RATIO;
const SPOT_X: Record<FilmSpot, number> = { left: 4, center: 38, right: 72 };

const pct = (value: unknown) => Number.parseFloat(String(value ?? 0));
export function propBox(key: string): Box | undefined {
  const prop = FILM_PROPS[key];
  if (!prop) return undefined;
  const w = pct(prop.style.width);
  return { x: pct(prop.style.left), y: pct(prop.style.top), w, h: w * STAGE_RATIO };
}
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

/** Props that cover each other or Brainy by more than a third read as a muddle. */
export function filmLayoutIssues(script: FilmScript, limit = 0.34): FilmIssue[] {
  const issues: FilmIssue[] = [];
  script.scenes.forEach((scene: FilmScene, i) => {
    const boxes = scene.props.map((key) => [key, propBox(key)] as const);
    const brainy = brainyBox(scene.brainy);
    boxes.forEach(([key, box], j) => {
      if (!box) return;
      if (overlap(box, brainy) > limit)
        issues.push({
          level: "warning",
          where: `scenes[${i}]`,
          message: `"${key}" covers Brainy (${scene.brainy})`,
        });
      for (const [other, otherBox] of boxes.slice(j + 1))
        if (otherBox && overlap(box, otherBox) > limit)
          issues.push({
            level: "warning",
            where: `scenes[${i}]`,
            message: `"${key}" and "${other}" overlap`,
          });
    });
  });
  return issues;
}
