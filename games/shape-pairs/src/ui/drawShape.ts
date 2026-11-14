import { type GameObjects, Math as PhaserMath } from "phaser";
import { type ShapeId, shapePath } from "../game/shapes";

/** The dark outline every shape and balloon shares, so white reads on the sky. */
export const INK = 0x24364b;

/**
 * One shape, centred on (x, y) and `size` across: a soft shadow, the fill, a
 * thick rounded outline and a small shine, like a sticker or a foil balloon.
 */
export function drawShape(
  g: GameObjects.Graphics,
  id: ShapeId,
  x: number,
  y: number,
  size: number,
  color: number,
  alpha = 1,
) {
  const at = (dx: number, dy: number, scale = 1) =>
    shapePath(id).map(
      (p) => new PhaserMath.Vector2(x + dx + p.x * size * scale, y + dy + p.y * size * scale),
    );
  const stroke = Math.max(size * 0.045, 3);
  g.fillStyle(0x10243a, 0.16 * alpha).fillPoints(at(size * 0.03, size * 0.06), true);
  g.fillStyle(color, alpha).fillPoints(at(0, 0), true);
  g.lineStyle(stroke, INK, alpha).strokePoints(at(0, 0), true, true);
  // The shine sits inside every shape's upper left, where all twelve paths have body.
  g.fillStyle(0xffffff, (color === 0xffffff ? 0 : 0.38) * alpha).fillEllipse(
    x - size * 0.1,
    y - size * 0.12,
    size * 0.14,
    size * 0.08,
  );
}
