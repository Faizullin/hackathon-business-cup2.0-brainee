import type { Scene } from "phaser";
import type { Rect } from "./layout";

const SPARK = "core:spark";
const CONFETTI_COLORS = [0xf97316, 0x22c55e, 0x3b82f6, 0xeab308, 0xec4899, 0x8b5cf6];

/** A small white dot, tinted per effect; made once per game. */
function sparkTexture(scene: Scene): string {
  if (!scene.textures.exists(SPARK)) {
    const dot = scene.make.graphics({}, false);
    dot.fillStyle(0xffffff, 1).fillCircle(6, 6, 6);
    dot.generateTexture(SPARK, 12, 12);
    dot.destroy();
  }
  return SPARK;
}

/** A short burst of sparkles where something landed. */
export function sparkle(scene: Scene, x: number, y: number, depth = 60): void {
  const emitter = scene.add.particles(x, y, sparkTexture(scene), {
    speed: { min: 60, max: 180 },
    lifespan: 450,
    scale: { start: 0.7, end: 0 },
    tint: [0xfde68a, 0xffffff, 0xfbbf24],
    emitting: false,
  });
  emitter.setDepth(depth).explode(14);
  scene.time.delayedCall(600, () => emitter.destroy());
}

/** Confetti falling from the top edge of `area`, for a finished round. */
export function confetti(scene: Scene, area: Rect, depth = 70): void {
  const emitter = scene.add.particles(0, 0, sparkTexture(scene), {
    x: { min: area.x, max: area.x + area.width },
    y: area.y - 10,
    speedY: { min: 80, max: 220 },
    speedX: { min: -60, max: 60 },
    gravityY: 260,
    lifespan: 1800,
    rotate: { min: 0, max: 360 },
    scale: { start: 0.9, end: 0.4 },
    tint: CONFETTI_COLORS,
    emitting: false,
  });
  emitter.setDepth(depth).explode(90);
  scene.time.delayedCall(2200, () => emitter.destroy());
}
