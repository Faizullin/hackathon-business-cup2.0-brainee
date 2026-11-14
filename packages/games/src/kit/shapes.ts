export const SHAPES = ["circle", "square", "triangle"] as const;
export const COLORS = ["coral", "sky", "sun", "mint"] as const;
export type ShapeSpec = {
  shape: (typeof SHAPES)[number];
  color: (typeof COLORS)[number];
  scale: number;
};
