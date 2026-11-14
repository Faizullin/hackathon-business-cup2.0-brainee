/**
 * Bright, friendly colours. Colour never tells the answer: every balloon is
 * white until it is matched, so two shapes may share a hue.
 */
export const SHAPES = [
  { id: "circle", group: "round", color: 0xff5a5f },
  { id: "oval", group: "round", color: 0x3d9df2 },
  { id: "triangle", group: "triangle", color: 0xffa51f },
  { id: "square", group: "four", color: 0x2fbf71 },
  { id: "rectangle", group: "four", color: 0xb05cf0 },
  { id: "diamond", group: "four", color: 0x00b8d9 },
  { id: "star", group: "star", color: 0xffd43b },
  { id: "heart", group: "heart", color: 0xff5fa2 },
  { id: "crescent", group: "crescent", color: 0x7c6cf2 },
  { id: "pentagon", group: "many", color: 0x12b886 },
  { id: "hexagon", group: "many", color: 0xff8a3d },
  { id: "drop", group: "drop", color: 0x4c8dff },
] as const;
export type ShapeId = (typeof SHAPES)[number]["id"];
export interface Point {
  x: number;
  y: number;
}

function polygon(n: number, rx = 0.48, ry = rx, rotation = -Math.PI / 2): Point[] {
  return Array.from({ length: n }, (_, i) => ({
    x: rx * Math.cos(rotation + (i * Math.PI * 2) / n),
    y: ry * Math.sin(rotation + (i * Math.PI * 2) / n),
  }));
}
function curve(a: Point, b: Point, c: Point, d: Point): Point[] {
  return Array.from({ length: 25 }, (_, i) => {
    const t = i / 24,
      u = 1 - t;
    return {
      x: u ** 3 * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t ** 3 * d.x,
      y: u ** 3 * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t ** 3 * d.y,
    };
  });
}
/** One outline for both sides, in a normalized unit square. No engine dependency. */
export function shapePath(id: ShapeId): Point[] {
  switch (id) {
    case "circle":
      return polygon(64);
    case "oval":
      return polygon(64, 0.32, 0.48);
    case "triangle":
      return [
        { x: 0, y: -0.48 },
        { x: 0.48, y: 0.43 },
        { x: -0.48, y: 0.43 },
      ];
    case "square":
      return [
        { x: -0.43, y: -0.43 },
        { x: 0.43, y: -0.43 },
        { x: 0.43, y: 0.43 },
        { x: -0.43, y: 0.43 },
      ];
    case "rectangle":
      return [
        { x: -0.48, y: -0.29 },
        { x: 0.48, y: -0.29 },
        { x: 0.48, y: 0.29 },
        { x: -0.48, y: 0.29 },
      ];
    case "diamond":
      return polygon(4, 0.33, 0.49);
    case "pentagon":
      return polygon(5);
    case "hexagon":
      return polygon(6, 0.48, 0.48, 0);
    case "star":
      return polygon(10).map((p, i) => (i % 2 ? { x: p.x * 0.46, y: p.y * 0.46 } : p));
    case "heart":
      return [
        ...curve({ x: 0, y: -0.2 }, { x: -0.5, y: -0.8 }, { x: -0.76, y: 0 }, { x: 0, y: 0.48 }),
        ...curve({ x: 0, y: 0.48 }, { x: 0.76, y: 0 }, { x: 0.5, y: -0.8 }, { x: 0, y: -0.2 }),
      ];
    case "crescent":
      return [
        ...curve(
          { x: 0.26, y: -0.47 },
          { x: -0.65, y: -0.48 },
          { x: -0.65, y: 0.48 },
          { x: 0.26, y: 0.47 },
        ),
        ...curve(
          { x: 0.26, y: 0.47 },
          { x: -0.16, y: 0.18 },
          { x: -0.16, y: -0.18 },
          { x: 0.26, y: -0.47 },
        ),
      ];
    case "drop":
      return [
        ...curve(
          { x: 0, y: -0.5 },
          { x: -0.17, y: -0.2 },
          { x: -0.72, y: 0.36 },
          { x: 0, y: 0.48 },
        ),
        ...curve({ x: 0, y: 0.48 }, { x: 0.72, y: 0.36 }, { x: 0.17, y: -0.2 }, { x: 0, y: -0.5 }),
      ];
  }
}

const anchors = new Map<string, number>();
/**
 * How far above (`edge` -1) or below (+1) its centre a shape's outline lies on
 * its middle line, in the unit square. A balloon's knot and a string tie on
 * there, so they touch the shape even where it has a notch (the star, the
 * heart) or a horn (the crescent).
 */
export function middleEdge(id: ShapeId, edge: -1 | 1): number {
  const key = `${id}:${edge}`;
  const cached = anchors.get(key);
  if (cached !== undefined) return cached;
  const path = shapePath(id);
  let best = -Infinity;
  for (let i = 0; i < path.length; i++) {
    const a = path[i],
      b = path[(i + 1) % path.length];
    if (a.x > 0 === b.x > 0 && a.x !== 0 && b.x !== 0) continue;
    const y =
      a.x === b.x
        ? Math.max(a.y * edge, b.y * edge)
        : (a.y + ((0 - a.x) / (b.x - a.x)) * (b.y - a.y)) * edge;
    best = Math.max(best, y);
  }
  const found = Number.isFinite(best) ? best * edge : 0.48 * edge;
  anchors.set(key, found);
  return found;
}
