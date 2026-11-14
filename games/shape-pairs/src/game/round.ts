import { seededRandom, shuffled } from "@brainee/engine-phaser/random";
import type { levelFor } from "./levels.ts";
import { SHAPES, type ShapeId } from "./shapes.ts";

export function pickRound(
  level: ReturnType<typeof levelFor>,
  seed: number,
): [ShapeId[], ShapeId[]] {
  const random = seededRandom(seed),
    seen = new Set<string>();
  const picked = shuffled(SHAPES, random)
    .filter((shape) => {
      if (!level.mixGroups && seen.has(shape.group)) return false;
      seen.add(shape.group);
      return true;
    })
    .slice(0, level.count)
    .map((shape) => shape.id);
  // One pair has only one position; a different order is impossible and unnecessary.
  if (picked.length === 1) return [picked, [...picked]];
  let other = [...picked];
  for (let attempt = 0; attempt < 20; attempt++) {
    other = shuffled(picked, random);
    if (other.every((id, i) => id !== picked[i])) return [picked, other];
  }
  return [picked, [...picked.slice(1), picked[0]]];
}
