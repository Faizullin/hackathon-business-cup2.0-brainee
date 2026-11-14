// Pure geometry for Brainy: a port of the prototype's brainy() (lines 671–733).
// Visual thresholds only; stages and rules live in @brainee/core.
import { type BrainyStats, bodyAverage, type Equipped } from "@brainee/core";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const hex = (h: string) => [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16));

/** Linear mix of two #rrggbb colors. */
export function mixColor(a: string, b: string, t: number) {
  const A = hex(a);
  const B = hex(b);
  return `#${A.map((v, i) =>
    Math.round(v + ((B[i] ?? v) - v) * t)
      .toString(16)
      .padStart(2, "0"),
  ).join("")}`;
}

export const INK = "#2B2350";

export function brainyModel(stats: BrainyStats, equipped: Equipped = {}) {
  const cx = 120;
  const cy = 124;
  const rx = 58 + stats.brain * 0.28;
  const ry = rx * 0.8;
  const mood = bodyAverage(stats) / 100;
  const t = clamp01((mood - 0.22) / 0.5);
  const fill = mixColor("#A7BC8C", "#FF8FA3", t);
  const dark = mixColor("#7A9064", "#E05C77", t);
  const er = 13 + stats.brain * 0.03;
  const lid = (1 - stats.eyes / 100) * 2 * er * 0.82;

  return {
    cx,
    cy,
    rx,
    ry,
    t,
    fill,
    dark,
    legs: { y: cy + ry * 0.74, len: 22 + stats.legs * 0.3, width: 8 + stats.legs * 0.05 },
    arms: {
      y: cy + ry * 0.15,
      width: 6 + stats.arms * 0.14,
      bicepR: (stats.arms - 40) * 0.2,
      handR: 7 + stats.arms * 0.03,
      lift: stats.arms * 0.5,
    },
    eyes: { y: cy + ry * 0.08, r: er, lid, xs: [cx - rx * 0.36, cx + rx * 0.36] as const },
    mouth: { y: cy + ry * 0.55, w: 14 + stats.mouth * 0.1, curve: (stats.mouth - 45) * 0.38 },
    equipped,
    flags: {
      brainStar: stats.brain > 72 && !equipped.head,
      eyeCircles: stats.eyes < 45,
      sleepyZ: stats.eyes < 35,
      lidLine: lid > 2,
      biceps: stats.arms > 55,
      backpack: stats.resp >= 70,
      blush: t > 0.6,
      screens: mood < 0.38,
    },
  };
}

export type BrainyModel = ReturnType<typeof brainyModel>;
