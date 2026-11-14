import type { Input, Scene } from "phaser";
import type { Tile } from "../game/matching";
import type { Point } from "../game/shapes";

interface Options {
  scene: Scene;
  enabled(): boolean;
  hit(point: Point): Tile | null;
  available(tile: Tile): boolean;
  blank(point: Point): boolean;
  tap(tile: Tile): void;
  drop(from: Tile, to: Tile): void;
  preview(from: Tile | null, to: Point | null): void;
  cancel(): void;
}

/** Shapes never move. One owned pointer draws a line; a short press remains a tap. */
export class PairInput {
  private press: { tile: Tile; id: number; at: Point; dragging: boolean } | null = null;
  private options: Options;
  constructor(options: Options) {
    this.options = options;
    options.scene.input.on("pointerdown", this.down);
    options.scene.input.on("pointermove", this.move);
    options.scene.input.on("pointerup", this.up);
    options.scene.input.on("pointerupoutside", this.leave);
    options.scene.input.on("gameout", this.leave);
  }
  private down = (p: Input.Pointer) => {
    if (!this.options.enabled() || this.press) return;
    const tile = this.options.hit(p);
    if (tile) {
      if (this.options.available(tile))
        this.press = { tile, id: p.id, at: { x: p.x, y: p.y }, dragging: false };
    } else if (this.options.blank(p)) this.options.cancel();
  };
  private move = (p: Input.Pointer) => {
    const press = this.press;
    if (!press || p.id !== press.id) return;
    if (!this.options.enabled()) {
      this.cancel();
      return;
    }
    if (Math.hypot(p.x - press.at.x, p.y - press.at.y) >= 8) press.dragging = true;
    if (press.dragging) this.options.preview(press.tile, { x: p.x, y: p.y });
  };
  private up = (p: Input.Pointer) => {
    const press = this.press;
    if (!press || p.id !== press.id) return;
    this.press = null;
    this.options.preview(null, null);
    if (!this.options.enabled()) return;
    const tile = this.options.hit(p);
    if (press.dragging) {
      if (tile && tile.side !== press.tile.side) this.options.drop(press.tile, tile);
      else this.options.cancel();
    } else if (tile?.side === press.tile.side && tile.id === press.tile.id) this.options.tap(tile);
  };
  cancel = () => {
    this.press = null;
    this.options.preview(null, null);
    this.options.cancel();
  };
  // Native toolbar controls are outside the canvas. Keep a tap selection when
  // moving to Hint, while an active line drag still cancels on leaving the game.
  private leave = () => {
    if (this.press) this.cancel();
  };
  destroy() {
    const input = this.options.scene.input;
    input.off("pointerdown", this.down);
    input.off("pointermove", this.move);
    input.off("pointerup", this.up);
    input.off("pointerupoutside", this.leave);
    input.off("gameout", this.leave);
    this.press = null;
  }
}
