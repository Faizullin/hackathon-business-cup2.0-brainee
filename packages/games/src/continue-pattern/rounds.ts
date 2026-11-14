import { createRng } from "@brainee/core";
import { COLORS, SHAPES, type ShapeSpec } from "../kit/shapes";

const s = (shape: ShapeSpec["shape"], color: ShapeSpec["color"], scale = 1): ShapeSpec => ({
  shape,
  color,
  scale,
});
type Pattern = { period: ShapeSpec[]; length: number };
// Prototype GAMES.pattern (909–920), with seeded round/answer order.
const PLANS: Record<1 | 2, Pattern[]> = {
  1: [
    { period: [s("circle", "coral"), s("square", "sky")], length: 4 },
    { period: [s("triangle", "mint"), s("triangle", "mint"), s("circle", "coral")], length: 5 },
    { period: [s("circle", "sky", 0.5), s("circle", "sky", 0.75), s("circle", "sky")], length: 5 },
    { period: [s("square", "coral"), s("square", "sun"), s("square", "mint")], length: 5 },
  ],
  2: [
    { period: [s("circle", "coral"), s("circle", "coral"), s("square", "sky")], length: 7 },
    {
      period: [
        s("triangle", "mint", 0.5),
        s("triangle", "mint", 0.75),
        s("triangle", "mint"),
        s("square", "sun", 0.5),
        s("square", "sun", 0.75),
        s("square", "sun"),
      ],
      length: 5,
    },
    { period: [s("circle", "coral"), s("circle", "sky"), s("circle", "sky")], length: 7 },
    {
      period: [
        s("square", "coral"),
        s("triangle", "coral"),
        s("circle", "coral"),
        s("square", "sky"),
        s("triangle", "sky"),
        s("circle", "sky"),
      ],
      length: 5,
    },
  ],
};
const signature = (shape: ShapeSpec) => `${shape.shape}:${shape.color}:${shape.scale}`;
export type PatternRound = {
  id: number;
  sequence: ShapeSpec[];
  options: ShapeSpec[];
  answerIndex: number;
};

export function generateRounds(level: number, seed: number): PatternRound[] {
  const rng = createRng(seed * 31 + level);
  return rng.shuffle(PLANS[level >= 2 ? 2 : 1]).map(({ period, length }, index) => {
    const sequence = Array.from({ length }, (_, i) => ({
      ...(period[i % period.length] as ShapeSpec),
    }));
    const answer = { ...(period[length % period.length] as ShapeSpec) };
    const alternatives = new Map<string, ShapeSpec>();
    for (const shape of [
      ...period,
      ...SHAPES.flatMap((shape) => COLORS.map((color) => s(shape, color))),
    ]) {
      if (signature(shape) !== signature(answer)) alternatives.set(signature(shape), shape);
    }
    const options = rng.shuffle([answer, ...rng.shuffle([...alternatives.values()]).slice(0, 2)]);
    return { id: index + 1, sequence, options, answerIndex: options.indexOf(answer) };
  });
}
