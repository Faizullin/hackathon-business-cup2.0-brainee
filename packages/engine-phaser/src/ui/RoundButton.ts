import { GameObjects, Geom, type Scene } from "phaser";

export interface RoundButtonOptions {
  radius?: number;
  label?: string;
  fontSize?: number;
  bgColor?: number;
  textColor?: string;
  strokeColor?: number;
  strokeWidth?: number;
  onClick?: () => void;
}

/**
 * Clean circular interactive button with hover ease and press feedback.
 */
export class RoundButton extends GameObjects.Container {
  private circle: GameObjects.Graphics;
  private text: GameObjects.Text;

  constructor(scene: Scene, x: number, y: number, options: RoundButtonOptions = {}) {
    super(scene, x, y);

    const radius = options.radius ?? 24;
    const bgColor = options.bgColor ?? 0xffffff;
    const strokeColor = options.strokeColor ?? 0x94a3b8;
    const strokeWidth = options.strokeWidth ?? 2;
    const label = options.label ?? "?";
    const fontSize = options.fontSize ?? 20;
    const textColor = options.textColor ?? "#1e293b";

    // Background circle with subtle shadow
    this.circle = scene.add.graphics();
    this.drawCircle(radius, bgColor, strokeColor, strokeWidth);
    this.add(this.circle);

    // Center label text
    this.text = scene.add
      .text(0, 0, label, {
        fontFamily: "Unbounded, system-ui, sans-serif",
        fontSize: `${fontSize}px`,
        color: textColor,
        align: "center",
      })
      .setOrigin(0.5);
    this.add(this.text);

    // A sized container measures its hit area from its top-left corner, so the
    // circle's centre is (radius, radius), not (0, 0).
    this.setSize(radius * 2, radius * 2);
    this.setInteractive(new Geom.Circle(radius, radius, radius), Geom.Circle.Contains);

    this.on("pointerover", () => {
      scene.tweens.add({
        targets: this,
        scale: 1.08,
        duration: 120,
        ease: "Quad.easeOut",
      });
    });

    this.on("pointerout", () => {
      scene.tweens.add({
        targets: this,
        scale: 1.0,
        duration: 120,
        ease: "Quad.easeOut",
      });
    });

    this.on("pointerdown", () => {
      scene.tweens.add({
        targets: this,
        scale: 0.94,
        duration: 60,
        ease: "Quad.easeIn",
      });
    });

    this.on("pointerup", () => {
      scene.tweens.add({
        targets: this,
        scale: 1.08,
        duration: 80,
        ease: "Back.easeOut",
      });
      options.onClick?.();
    });

    scene.add.existing(this);
  }

  private drawCircle(radius: number, bgColor: number, strokeColor: number, strokeWidth: number) {
    this.circle.clear();
    // Drop shadow
    this.circle.fillStyle(0x000000, 0.1);
    this.circle.fillCircle(0, 2, radius + 1);
    // Main fill
    this.circle.fillStyle(bgColor, 1);
    this.circle.fillCircle(0, 0, radius);
    // Border stroke
    this.circle.lineStyle(strokeWidth, strokeColor, 0.8);
    this.circle.strokeCircle(0, 0, radius);
  }

  setLabel(label: string) {
    this.text.setText(label);
    return this;
  }

  /** A disabled button is dimmed and ignores the pointer. */
  setEnabled(enabled: boolean) {
    if (this.input) this.input.enabled = enabled;
    return this.setAlpha(enabled ? 1 : 0.35);
  }
}
