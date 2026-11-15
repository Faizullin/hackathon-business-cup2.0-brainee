import type { GameObjects, Input, Scene } from "phaser";
import { dropResult, type Point, pulledPosition } from "./snap";

/** Where an item is drawn: its centre and its scale. */
export interface Placement {
  x: number;
  y: number;
  scale: number;
}

export interface DragToTargetOptions<T extends GameObjects.Image> {
  scene: Scene;
  /** Where the item belongs, as the layout is now. */
  target(item: T): Placement;
  /** Where the item rests until it is placed, as the layout is now. */
  home(item: T): Placement;
  /** The item's size on its target; the snap and pull distances scale with it. */
  snapSize(item: T): { width: number; height: number };
  /** False while nothing may be moved (a finished round). */
  enabled(): boolean;
  /** No tilt and no glide: items jump to where they go. */
  reducedMotion?: boolean;
  /** The selection changed (a tap on an item, or `null` when it clears). */
  onSelect?(item: T | null): void;
  /** The item is on its way to its target and can no longer be moved. */
  onSnap(item: T): void;
  /** The item is on its way home after a drop or tap at `drop` that missed. */
  onMiss(item: T, drop: Point): void;
}

/** Depths the controller gives items: on their target, at rest, and in the hand. */
export const PLACED_DEPTH = 10;
export const RESTING_DEPTH = 20;
export const LIFTED_DEPTH = 100;

/** The lift while an item is in the hand. */
const LIFT_SCALE = 1.06;

/**
 * Drag an item onto its own target, for any game where each piece has one
 * right place. A drop near the target snaps in; any other drop glides the item
 * home. A press that doesn't become a drag selects the item, so a game can
 * place it on a second tap (`place` / `miss`). Snaps are forgiving and pull
 * the item in once it is close (see `snap.ts`).
 *
 * The scene owns the consequences (sounds, counting, events) in `onSnap` and
 * `onMiss`; set `scene.input.dragDistanceThreshold` so a tap isn't a drag.
 */
export class DragToTarget<T extends GameObjects.Image> {
  private readonly options: DragToTargetOptions<T>;
  private readonly moving = new Set<T>();
  private selectedItem: T | null = null;
  private draggedItem: T | null = null;

  constructor(options: DragToTargetOptions<T>) {
    this.options = options;
  }

  /** The item a tap picked, waiting for a tap on its place. */
  get selected(): T | null {
    return this.selectedItem;
  }

  /** The item in the hand. */
  get dragging(): T | null {
    return this.draggedItem;
  }

  /** In the hand or gliding: the layout should leave the item alone. */
  isBusy(item: T): boolean {
    return this.draggedItem === item || this.moving.has(item);
  }

  /** Makes `item` draggable and tappable. */
  add(item: T): void {
    const { scene } = this.options;
    let dragged = false;
    // Where the press was, measured from the item's centre. Phaser measures its own
    // offset when the drag starts, a move later, so a quick swipe would trail behind.
    const grab = { x: 0, y: 0 };
    item.setInteractive({ useHandCursor: true });
    scene.input.setDraggable(item);

    item.on("pointerdown", (pointer: Input.Pointer) => {
      dragged = false;
      grab.x = pointer.worldX - item.x;
      grab.y = pointer.worldY - item.y;
    });

    item.on("dragstart", () => {
      if (!this.options.enabled() || this.moving.has(item)) return;
      dragged = true;
      this.select(null);
      this.draggedItem = item;
      item.setDepth(LIFTED_DEPTH);
      scene.tweens.add({
        targets: item,
        scale: this.options.target(item).scale * LIFT_SCALE,
        angle: this.options.reducedMotion ? 0 : Math.random() * 4 - 2,
        duration: 120,
        ease: "Quad.easeOut",
      });
    });

    item.on("drag", (pointer: Input.Pointer) => {
      if (this.draggedItem !== item) return;
      const { width, height } = this.options.snapSize(item);
      const held = { x: pointer.worldX - grab.x, y: pointer.worldY - grab.y };
      const eased = pulledPosition(held, this.options.target(item), width, height);
      item.setPosition(eased.x, eased.y);
    });

    item.on("dragend", () => {
      if (this.draggedItem !== item) return;
      this.draggedItem = null;
      scene.tweens.killTweensOf(item);
      const { width, height } = this.options.snapSize(item);
      if (dropResult(item, this.options.target(item), width, height) === "snap") this.place(item);
      else this.miss(item, { x: item.x, y: item.y });
    });

    // A press that doesn't move past the drag threshold is a tap: select the item.
    item.on("pointerup", () => {
      if (dragged || !this.options.enabled() || this.moving.has(item)) return;
      this.select(this.selectedItem === item ? null : item);
    });
  }

  select(item: T | null): void {
    if (this.selectedItem === item) return;
    this.selectedItem = item;
    this.options.onSelect?.(item);
  }

  /** Sends the item to its target for good. */
  place(item: T): void {
    this.select(null);
    item.disableInteractive();
    this.glide(item, () => this.options.target(item), PLACED_DEPTH, 160, "Back.easeOut");
    this.options.onSnap(item);
  }

  /** Sends the item home after a wrong drop or tap at `drop`. */
  miss(item: T, drop: Point): void {
    this.select(null);
    this.glide(item, () => this.options.home(item), RESTING_DEPTH, 250, "Quad.easeOut");
    this.options.onMiss(item, drop);
  }

  /** Forgets every item (a new round). */
  clear(): void {
    this.moving.clear();
    this.selectedItem = null;
    this.draggedItem = null;
  }

  private glide(
    item: T,
    destination: () => Placement,
    depth: number,
    duration: number,
    ease: string,
  ): void {
    const { scene } = this.options;
    const to = destination();
    // Already there (a tap sent it "home" without it ever leaving): nothing to wait for,
    // so the very next tap on it counts.
    if (Math.hypot(item.x - to.x, item.y - to.y) < 0.5 && Math.abs(item.scale - to.scale) < 0.001) {
      this.moving.delete(item);
      item.setAngle(0).setDepth(depth);
      return;
    }
    this.moving.add(item);
    scene.tweens.add({
      targets: item,
      x: to.x,
      y: to.y,
      scale: to.scale,
      angle: 0,
      duration: this.options.reducedMotion ? 0 : duration,
      ease,
      // The layout may have changed mid-flight (a resize): land where the place is now.
      onComplete: () => {
        if (!this.moving.delete(item) || !item.active) return;
        const now = destination();
        item.setPosition(now.x, now.y).setScale(now.scale).setAngle(0).setDepth(depth);
      },
    });
  }
}
