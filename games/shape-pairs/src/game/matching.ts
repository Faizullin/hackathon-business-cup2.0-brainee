import { shouldGlowHint } from "@brainee/engine-phaser/snap";
import type { ShapeId } from "./shapes.ts";
export type Side = 0 | 1;
export interface Tile {
  id: ShapeId;
  side: Side;
}
export type Outcome =
  | { kind: "selected" }
  | { kind: "ignored" }
  | { kind: "matched"; shape: ShapeId; attempts: number }
  | { kind: "rejected"; shape: ShapeId; picked: ShapeId; hint: boolean };

export class Matching {
  readonly ids: readonly ShapeId[];
  selected: Tile | null = null;
  readonly matched = new Set<ShapeId>();
  readonly wrong = new Map<ShapeId, number>();
  readonly hints = new Map<ShapeId, Side>();
  wrongTries = 0;
  constructor(ids: readonly ShapeId[]) {
    this.ids = ids;
  }
  get completed() {
    return this.matched.size === this.ids.length;
  }
  available(tile: Tile) {
    return this.ids.includes(tile.id) && !this.matched.has(tile.id);
  }
  tap(tile: Tile): Outcome {
    if (!this.available(tile)) return { kind: "ignored" };
    const from = this.selected;
    if (!from || from.side === tile.side) {
      this.selected = from?.id === tile.id ? null : tile;
      return { kind: "selected" };
    }
    return this.connect(from, tile);
  }
  connect(from: Tile, to: Tile): Outcome {
    this.selected = null;
    if (!this.available(from) || !this.available(to) || from.side === to.side)
      return { kind: "ignored" };
    if (from.id === to.id) {
      this.matched.add(from.id);
      this.hints.delete(from.id);
      return { kind: "matched", shape: from.id, attempts: (this.wrong.get(from.id) ?? 0) + 1 };
    }
    const wrong = (this.wrong.get(from.id) ?? 0) + 1;
    this.wrong.set(from.id, wrong);
    this.wrongTries++;
    const hint = shouldGlowHint(wrong);
    if (hint) this.hints.set(from.id, to.side);
    return { kind: "rejected", shape: from.id, picked: to.id, hint };
  }
}
