import type { GameObjects, Input, Scene } from "phaser";
import { LIFTED_DEPTH, PLACED_DEPTH, type Placement, RESTING_DEPTH } from "./dragToTarget";
import type { Point } from "./snap";

export interface DragToZoneOptions<T extends GameObjects.Image, Z> {
  scene: Scene;
  /** The zone under a point, or `null` on open space. */
  zoneAt(point: Point): Z | null;
  /** Whether `item` belongs in `zone`. */
  accepts(item: T, zone: Z): boolean;
  /** Where the item ends up in a zone that took it, as the layout is now. */
  destination(item: T, zone: Z): Placement;
  /** Where the item rests until it is placed, as the layout is now. */
  home(item: T): Placement;
  /** False while nothing may be moved (a finished round). */
  enabled(): boolean;
  /** No tilt and no glide: items jump to where they go. */
  reducedMotion?: boolean;
  /** The selection changed (a tap on an item, or `null` when it clears). */
  onSelect?(item: T | null): void;
  /** The zone under a dragged item changed; `null` when it left every zone or was dropped. */
  onHover?(zone: Z | null): void;
  /**
   * The item was put in a zone that takes it and can no longer be moved.
   * Called before it glides there, so `destination` can already count it.
   */
  onPlace(item: T, zone: Z): void;
  /**
   * The item is on its way home: dropped on a zone that doesn't take it, or
   * (`zone` null) on open space.
   */
  onMiss(item: T, zone: Z | null, drop: Point): void;
}

/** The lift while an item is in the hand. */
const LIFT_SCALE = 1.1;

/**
 * Drag an item into one of several zones, for sorting games: any zone can be
 * hit, and the game says which ones take the item (`accepts`). A drop in a
 * zone that takes it sends it to `destination`; any other drop glides it home.
 * A press that doesn't become a drag selects the item, so a game can drop it
 * into a zone on a second tap (`drop`).
 *
 * Unlike `DragToTarget`, nothing pulls the item toward its right zone, which
 * would give the answer away. Set `scene.input.dragDistanceThreshold` so a
 * tap isn't a drag.
 */
export class DragToZone<T extends GameObjects.Image, Z> {
  private readonly options: DragToZoneOptions<T, Z>;
  private readonly moving = new Set<T>();
  private selectedItem: T | null = null;
  private draggedItem: T | null = null;
  private hovered: Z | null = null;

  constructor(options: DragToZoneOptions<T, Z>) {
    this.options = options;
  }

  /** The item a tap picked, waiting for a tap on a zone. */
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
        scale: this.options.home(item).scale * LIFT_SCALE,
        angle: this.options.reducedMotion ? 0 : Math.random() * 4 - 2,
        duration: 120,
        ease: "Quad.easeOut",
      });
    });

    item.on("drag", (pointer: Input.Pointer) => {
      if (this.draggedItem !== item) return;
      item.setPosition(pointer.worldX - grab.x, pointer.worldY - grab.y);
      this.hover(this.options.zoneAt({ x: pointer.worldX, y: pointer.worldY }));
    });

    item.on("dragend", (pointer: Input.Pointer) => {
      if (this.draggedItem !== item) return;
      this.draggedItem = null;
      this.hover(null);
      scene.tweens.killTweensOf(item);
      // The finger decides where it went, not the picture's centre.
      this.drop(item, { x: pointer.worldX, y: pointer.worldY });
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

  /** Puts `item` where `point` is: into a zone that takes it, or back home. */
  drop(item: T, point: Point): void {
    const zone = this.options.zoneAt(point);
    if (zone !== null && this.options.accepts(item, zone)) this.place(item, zone);
    else this.miss(item, zone, point);
  }

  /** Sends the item into `zone` for good. */
  place(item: T, zone: Z): void {
    this.select(null);
    item.disableInteractive();
    // Busy before the game hears of it, so a layout it runs leaves the item to glide.
    this.moving.add(item);
    this.options.onPlace(item, zone);
    this.glide(item, () => this.options.destination(item, zone), PLACED_DEPTH, 180, "Back.easeOut");
  }

  /** Sends the item home after a drop on `zone` (or open space) at `drop`. */
  miss(item: T, zone: Z | null, drop: Point): void {
    this.select(null);
    this.moving.add(item);
    this.options.onMiss(item, zone, drop);
    this.glide(item, () => this.options.home(item), RESTING_DEPTH, 250, "Quad.easeOut");
  }

  /** Forgets every item (a new round). */
  clear(): void {
    this.moving.clear();
    this.selectedItem = null;
    this.draggedItem = null;
    this.hovered = null;
  }

  private hover(zone: Z | null): void {
    if (zone === this.hovered) return;
    this.hovered = zone;
    this.options.onHover?.(zone);
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
