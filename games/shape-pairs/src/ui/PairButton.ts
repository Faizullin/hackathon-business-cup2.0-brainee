import { RoundButton, type RoundButtonOptions } from "@brainee/engine-phaser/ui/RoundButton";
import type { Scene } from "phaser";

/** Keep the shared appearance, with a finger-size hit area and motion preference. */
export class PairButton extends RoundButton {
  constructor(scene: Scene, options: RoundButtonOptions, reducedMotion: boolean) {
    super(scene, 0, 0, { radius: 36, strokeColor: 0xd5cec0, ...options });
    if (reducedMotion) {
      for (const event of ["pointerover", "pointerout", "pointerdown", "pointerup"])
        this.removeAllListeners(event);
      this.on("pointerup", () => options.onClick?.());
    }
    this.setDepth(50);
  }
}
