// biome-ignore-all lint/style/noNonNullAssertion: ported GSP source; lookups are guarded by the scene lifecycle
import { BridgedScene } from "@brainee/engine-phaser/bridge";
import { celebrate } from "@brainee/engine-phaser/celebrate";
import { confetti } from "@brainee/engine-phaser/effects";
import { seedFrom } from "@brainee/engine-phaser/random";
import { playReturnSound, playSnapSound, playVictorySound } from "@brainee/engine-phaser/sounds";
import { type GameObjects, Math as PhaserMath } from "phaser";
import type { ShapePairsContract } from "../contract";
import { center, computeLayout, contains, type Rect } from "../game/layout";
import { levelFor } from "../game/levels";
import { Matching, type Outcome, type Side, type Tile } from "../game/matching";
import { advanceProgress, type Progress, parseProgress, START } from "../game/progress";
import { pickRound } from "../game/round";
import { middleEdge, type Point, SHAPES, type ShapeId } from "../game/shapes";
import { COPY, type GameLocale, resolveLocale } from "../i18n";
import { PairInput } from "../input/PairInput";
import { drawShape, INK } from "../ui/drawShape";
import { GameMenu } from "../ui/GameMenu";
import { PairButton } from "../ui/PairButton";

/** How long a wrongly picked shape shakes its head, and a fresh pair pops. */
const SHAKE_MS = 380;
const POP_MS = 650;
const PREFERENCES_KEY = "shape-pairs.preferences.v1";

/** Where a tile is drawn this frame, and where its string ties on. */
interface Pose {
  x: number;
  y: number;
  size: number;
  tie: Point;
}

/**
 * Shape Pairs: white shape balloons float in the sky over the same shapes in
 * colour on the grass. Tap a shape and then its twin (or draw a line between
 * them): a string ties them together and the balloon takes its colour. A wrong
 * pick only shakes its head. Nothing is spoken.
 */
export class ShapePairsScene extends BridgedScene<ShapePairsContract> {
  private progress: Progress = { ...START };
  private model: Matching | null = null;
  private orders: [ShapeId[], ShapeId[]] = [[], []];
  private geometry: ReturnType<typeof computeLayout> | null = null;
  private roundLevel = 1;
  private roundIndex = 0;
  private baseSeed = 0;
  private run = 0;
  private elapsed = 0;
  private reducedMotion = false;
  private soundEnabled = true;
  private completed = false;
  private newest: ShapeId | null = null;
  private emphasisLeft = 0;
  private temporaryHint: { id: ShapeId; side: Side; left: number } | null = null;
  private preview: { from: Tile; to: Point } | null = null;
  /** Runs all the time (balloons bob after the round is done too); `elapsed` is the round's time. */
  private clock = 0;
  private shake: { tile: Tile; left: number } | null = null;
  private backdrop!: GameObjects.Graphics;
  private controller!: PairInput;
  private graphics!: GameObjects.Graphics;
  private nextButton!: PairButton;
  private menu!: GameMenu;
  private menuOpen = true;
  private initialized = false;
  private locale: GameLocale = "en";
  private appliedHostLocale: string | null = null;
  private saveStatus: "idle" | "saving" | "saved" | "unavailable" = "idle";

  constructor() {
    super("ShapePairsScene");
  }

  async create() {
    const run = ++this.run;
    this.model = null;
    this.geometry = null;
    this.roundIndex = 0;
    this.completed = false;
    this.preview = null;
    this.temporaryHint = null;
    this.shake = null;
    this.initialized = false;
    this.menuOpen = true;
    this.appliedHostLocale = null;
    this.input.enabled = false;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.backdrop = this.add.graphics().setDepth(-1);
    this.graphics = this.add.graphics();
    this.nextButton = new PairButton(
      this,
      {
        // Bright and ringed in white, so it stands out against the grass and the strings.
        label: "➔",
        fontSize: 34,
        radius: 44,
        bgColor: 0x22c55e,
        textColor: "#ffffff",
        strokeColor: 0xffffff,
        strokeWidth: 5,
        onClick: () => {
          if (this.completed && !this.game.isPaused) this.startRound();
        },
      },
      this.reducedMotion,
    ).setVisible(false);
    this.controller = new PairInput({
      scene: this,
      enabled: () =>
        Boolean(this.model) && !this.completed && !this.game.isPaused && !this.menuOpen,
      hit: (p) => this.hit(p),
      available: (tile) => this.model?.available(tile) ?? false,
      blank: (p) => p.y >= 88,
      tap: (tile) => this.handle(this.model!.tap(tile), tile),
      drop: (from, to) => this.handle(this.model!.connect(from, to), to),
      preview: (from, to) => {
        this.preview = from && to ? { from, to } : null;
        this.draw();
      },
      cancel: () => {
        if (this.model) this.model.selected = null;
        this.draw();
      },
    });
    this.scale.on("resize", this.resize, this);
    this.game.events.on("pause", this.controller.cancel);
    const syncControls = () => this.menu?.setState(this.completed, this.game.isPaused);
    this.game.events.on("pause", syncControls);
    this.game.events.on("resume", syncControls);
    const stopConfig = this.bridge.onConfig(() => {
      if (!this.bridge.bridged || !this.bridge.context) return;
      if (this.appliedHostLocale === this.bridge.context.locale) return;
      this.appliedHostLocale = this.bridge.context.locale;
      this.applyLocale(resolveLocale(this.appliedHostLocale, null, null, []));
    });
    this.events.once("shutdown", () => {
      ++this.run;
      this.scale.off("resize", this.resize, this);
      this.game.events.off("pause", this.controller.cancel);
      this.game.events.off("pause", syncControls);
      this.game.events.off("resume", syncControls);
      stopConfig();
      this.menu?.destroy();
      this.time.paused = false;
      this.tweens.resumeAll();
      this.controller.destroy();
      this.model = null;
      this.temporaryHint = null;
    });
    const hosted = await this.bridge.ready;
    const saved = hosted
      ? /* Explore preview: the host keeps no game progress (no learning writes). */ null
      : null;
    if (this.run !== run) return;
    const url = new URLSearchParams(window.location.search);
    const preferences = this.readPreferences();
    this.progress = parseProgress(
      hosted && saved
        ? saved
        : {
            level: url.has("level") && !hosted ? Number(url.get("level")) : preferences.level,
            solvedAtLevel: 0,
          },
    );
    this.baseSeed =
      !hosted && url.has("seed") ? seedFrom(url.get("seed")!) : Math.floor(Math.random() * 2 ** 32);
    this.soundEnabled = typeof preferences.sound === "boolean" ? preferences.sound : true;
    this.locale = resolveLocale(
      this.bridge.bridged ? this.bridge.context?.locale : null,
      url.get("lang"),
      preferences.locale,
      navigator.languages,
    );
    this.appliedHostLocale = this.bridge.bridged ? (this.bridge.context?.locale ?? null) : null;
    this.menu = new GameMenu(this.locale, this.soundEnabled, {
      start: (level) => {
        if (this.game.isPaused) return;
        if (level !== this.progress.level) this.progress = { level, solvedAtLevel: 0 };
        this.savePreferences();
        this.closeMenu();
        this.startRound();
      },
      resume: () => {
        if (!this.game.isPaused) this.closeMenu();
      },
      menu: () => {
        if (!this.game.isPaused) this.openMenu();
      },
      hint: () => this.showHint(),
      sound: (enabled) => {
        this.soundEnabled = enabled;
        this.savePreferences();
      },
      language: (locale) => {
        this.applyLocale(locale);
        this.savePreferences();
      },
    });
    this.applyLocale(this.locale);
    this.initialized = true;
    this.openMenu();
  }

  private readPreferences(): Record<string, unknown> {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? "null");
      return saved && typeof saved === "object" && !Array.isArray(saved)
        ? (saved as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }

  private savePreferences() {
    try {
      localStorage.setItem(
        PREFERENCES_KEY,
        JSON.stringify({
          level: this.progress.level,
          locale: this.locale,
          sound: this.soundEnabled,
        }),
      );
    } catch {
      /* Browser storage may be disabled inside an embedded game. */
    }
  }

  private applyLocale(locale: GameLocale) {
    this.locale = locale;
    document.documentElement.lang = locale;
    document.title = COPY[locale].title;
    this.menu?.setLocale(locale);
  }

  private openMenu() {
    this.controller.cancel();
    this.menuOpen = true;
    this.input.enabled = false;
    this.time.paused = true;
    this.tweens.pauseAll();
    this.menu.open(
      this.progress.level,
      Boolean(this.model) && !this.completed,
      Boolean(this.model),
    );
    this.menu.setState(this.completed, this.game.isPaused);
  }

  private closeMenu() {
    this.menuOpen = false;
    this.input.enabled = true;
    this.time.paused = false;
    this.tweens.resumeAll();
    this.menu.close();
  }

  private startRound() {
    this.geometry = null;
    const level = levelFor(this.progress.level);
    this.roundLevel = level.level;
    this.orders = pickRound(level, seedFrom(`${this.baseSeed}:${this.roundIndex++}`));
    this.model = new Matching(this.orders[0]);
    this.preview = null;
    this.temporaryHint = null;
    this.newest = null;
    this.emphasisLeft = 0;
    this.shake = null;
    this.elapsed = 0;
    this.completed = false;
    this.saveStatus = "idle";
    this.nextButton.setVisible(false);
    this.menu.setState(false, this.game.isPaused);
    this.resize();
    this.bridge.lifecycle("started");
    this.bridge.track("round_started", { level: this.roundLevel, shapes: [...this.orders[0]] });
    this.bridge.state.set("matched", 0);
    this.bridge.state.set("total", this.orders[0].length);
    this.bridge.state.set("level", this.roundLevel);
  }

  private rect(tile: Tile): Rect {
    return this.geometry!.slots[tile.side][this.orders[tile.side].indexOf(tile.id)];
  }
  private hit(p: Point): Tile | null {
    if (!this.geometry || !this.model) return null;
    for (const side of [0, 1] as const) {
      const i = this.geometry.slots[side].findIndex((r) => contains(r, p));
      if (i >= 0) return { side, id: this.orders[side][i] };
    }
    return null;
  }
  /** `picked` is the tile the child just chose; a wrong one shakes its head. */
  private handle(result: Outcome, picked: Tile) {
    const model = this.model!;
    if (result.kind === "matched") {
      this.newest = result.shape;
      this.emphasisLeft = POP_MS;
      if (this.temporaryHint?.id === result.shape) this.temporaryHint = null;
      if (this.soundEnabled) playSnapSound();
      celebrate(center(this.rect({ id: result.shape, side: 1 })), this.geometry!.board);
      this.bridge.track("pair_matched", { shape: result.shape, attempts: result.attempts });
      this.bridge.state.set("matched", model.matched.size);
      if (model.completed) this.finish();
    } else if (result.kind === "rejected") {
      this.shake = { tile: picked, left: SHAKE_MS };
      if (this.soundEnabled) playReturnSound();
      this.bridge.track("pair_rejected", { shape: result.shape, picked: result.picked });
      if (result.hint) this.bridge.track("hint_shown", { shape: result.shape });
    }
    this.draw();
  }
  private showHint() {
    if (!this.model || this.completed || this.game.isPaused || this.menuOpen) return;
    const selected = this.model.selected ?? {
      id: this.orders[0].find((id) => !this.model!.matched.has(id))!,
      side: 0 as const,
    };
    this.model.selected = selected;
    this.temporaryHint = { id: selected.id, side: selected.side === 0 ? 1 : 0, left: 2500 };
    this.bridge.track("hint_shown", { shape: selected.id });
    this.draw();
  }
  private finish() {
    if (this.completed) return;
    this.completed = true;
    this.preview = null;
    this.temporaryHint = null;
    this.menu.setState(true, this.game.isPaused);
    this.nextButton.setVisible(true);
    if (this.soundEnabled) playVictorySound();
    if (!this.reducedMotion) confetti(this, this.geometry!.board);
    const result = { durationMs: Math.round(this.elapsed), wrongTries: this.model!.wrongTries };
    this.bridge.track("round_completed", result);
    this.bridge.lifecycle("completed", result);
    this.progress = advanceProgress(this.progress);
    const run = this.run,
      round = this.roundIndex;
    this.saveStatus = "saving";
    Promise.reject(new Error("Explore has no host progress")).then(
      () => {
        if (run === this.run && round === this.roundIndex) this.saveStatus = "saved";
      },
      () => {
        if (run === this.run && round === this.roundIndex) this.saveStatus = "unavailable";
      },
    );
  }
  private resize() {
    // Preserve a tap selection across rotation, but cancel an in-flight line.
    const selected = this.preview ? null : (this.model?.selected ?? null);
    this.controller?.cancel();
    if (this.model) this.model.selected = selected;
    if (!this.model) return;
    const { width, height } = this.scale.gameSize;
    this.geometry = computeLayout(width, height, this.orders[0].length);
    this.nextButton.setPosition(this.geometry.next.x, this.geometry.next.y);
    this.drawBackdrop();
    this.draw();
  }

  update(_time: number, delta: number) {
    if (!this.model || this.menuOpen) return;
    if (!this.completed) this.elapsed += delta;
    if (this.temporaryHint) {
      this.temporaryHint.left -= delta;
      if (this.temporaryHint.left <= 0) this.temporaryHint = null;
    }
    this.emphasisLeft = Math.max(0, this.emphasisLeft - delta);
    this.clock += delta;
    if (this.shake) {
      this.shake.left -= delta;
      if (this.shake.left <= 0) this.shake = null;
    }
    this.draw();
  }

  /** Sky, clouds and a grassy hill; redrawn only when the window changes. */
  private drawBackdrop() {
    const layout = this.geometry;
    if (!layout) return;
    const { width, height } = this.scale.gameSize;
    const g = this.backdrop.clear();
    g.fillGradientStyle(0x7fd0ff, 0x7fd0ff, 0xd6f1ff, 0xd6f1ff, 1).fillRect(0, 0, width, height);

    // Clouds drift between the buttons' strip and the grass, out of the top-left corner.
    const unit = Math.min(width, height);
    const cloud = (x: number, y: number, scale: number) => {
      const r = unit * 0.07 * scale;
      g.fillStyle(0xffffff, 0.75);
      g.fillEllipse(x, y, r * 3.2, r * 1.3)
        .fillEllipse(x - r * 0.9, y - r * 0.5, r * 1.6, r * 1.3)
        .fillEllipse(x + r * 0.5, y - r * 0.75, r * 1.9, r * 1.6);
    };
    cloud(width * 0.3, 56, 0.9);
    cloud(width * 0.62, layout.next.y - 6, 1.2);
    cloud(width * 0.1, layout.next.y + 10, 0.8);
    cloud(width * 0.9, layout.panels[0].y + layout.panels[0].height * 0.55, 0.9);

    // The hill rises just above the shapes, so they sit on the grass.
    const [, lower] = layout.panels;
    const top = lower.y - 22;
    const hill = (lift: number, color: number) => {
      const points: PhaserMath.Vector2[] = [new PhaserMath.Vector2(0, height)];
      for (let i = 0; i <= 40; i++) {
        const x = (width * i) / 40;
        points.push(new PhaserMath.Vector2(x, top + lift - Math.sin((i / 40) * Math.PI) * 16));
      }
      points.push(new PhaserMath.Vector2(width, height));
      g.fillStyle(color, 1).fillPoints(points, true);
    };
    hill(0, 0x8ed36b);
    hill(18, 0x7cc75a);
    g.fillStyle(0x6ab84c, 0.55);
    for (let i = 0; i < 14; i++) {
      // A sprinkle of darker tufts, fixed in place so they don't flicker on redraw.
      const x = width * ((i * 0.618 + 0.11) % 1),
        y = top + 34 + (((i * 37) % 100) / 100) * Math.max(height - top - 50, 0);
      g.fillTriangle(x - 7, y, x, y - 12, x + 7, y);
    }
  }

  /** Where a tile is drawn now: bobbing if it floats, shaking after a wrong pick, popping when just tied. */
  private pose(tile: Tile): Pose {
    const r = this.rect(tile),
      model = this.model!;
    const index = this.orders[tile.side].indexOf(tile.id);
    const selected = model.selected?.id === tile.id && model.selected.side === tile.side;
    const fresh = tile.id === this.newest && this.emphasisLeft > 0;
    const still = this.reducedMotion;
    const bob =
      tile.side === 1 && !still
        ? Math.sin(this.clock / 700 + index * 1.7) * Math.min(r.width * 0.035, 5)
        : 0;
    const shaking =
      this.shake && this.shake.tile.id === tile.id && this.shake.tile.side === tile.side
        ? this.shake.left
        : 0;
    const dx =
      shaking && !still ? Math.sin(shaking / 26) * r.width * 0.07 * (shaking / SHAKE_MS) : 0;
    const pop =
      fresh && !still ? 1 + 0.16 * Math.sin(Math.PI * (1 - this.emphasisLeft / POP_MS)) : 1;
    const size = r.width * 0.68 * (selected ? 1.08 : 1) * pop;
    const x = r.x + r.width / 2 + dx;
    // A balloon rides high in its place, leaving room for its knot; a shape sits low, on its shadow.
    const y = r.y + r.height * (tile.side === 1 ? 0.45 : 0.52) + bob;
    // The string ties on where the outline crosses the shape's middle line.
    const tieY =
      tile.side === 1
        ? y + size * middleEdge(tile.id, 1) + r.width * 0.045
        : y + size * middleEdge(tile.id, -1);
    return { x, y, size, tie: { x, y: tieY } };
  }

  /** A string from one point to another, sagging a little to one side. */
  private drawString(
    g: GameObjects.Graphics,
    from: Point,
    to: Point,
    width: number,
    color: number,
    alpha: number,
  ) {
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    if (length < 1) return;
    const bend = Math.min(length * 0.08, 26) * (to.x >= from.x ? 1 : -1);
    const control = {
      x: (from.x + to.x) / 2 + ((to.y - from.y) / length) * bend,
      y: (from.y + to.y) / 2 - ((to.x - from.x) / length) * bend,
    };
    const points = Array.from({ length: 21 }, (_, i) => {
      const t = i / 20,
        u = 1 - t;
      return new PhaserMath.Vector2(
        u * u * from.x + 2 * u * t * control.x + t * t * to.x,
        u * u * from.y + 2 * u * t * control.y + t * t * to.y,
      );
    });
    g.lineStyle(width, color, alpha).strokePoints(points, false, false);
  }

  private draw() {
    if (!this.graphics || !this.geometry || !this.model) return;
    const g = this.graphics.clear(),
      model = this.model;
    const pulse = this.reducedMotion ? 1 : 0.7 + Math.sin(this.clock / 220) * 0.3;

    // Strings first, so the shapes and balloons sit on top of their ends.
    for (const id of model.matched) {
      const shape = this.pose({ id, side: 0 }),
        balloon = this.pose({ id, side: 1 });
      const width = Math.max(this.rect({ id, side: 0 }).width * 0.03, 3);
      if (id === this.newest && this.emphasisLeft > 0)
        this.drawString(g, shape.tie, balloon.tie, width * 3, 0xffe066, 0.85);
      this.drawString(g, shape.tie, balloon.tie, width, INK, 0.85);
    }
    if (this.preview) {
      const from = this.pose(this.preview.from);
      const width = Math.max(this.rect(this.preview.from).width * 0.035, 4);
      this.drawString(g, from.tie, this.preview.to, width, INK, 0.9);
      g.fillStyle(INK, 0.9).fillCircle(this.preview.to.x, this.preview.to.y, width * 1.4);
    }

    for (const side of [0, 1] as const)
      for (const id of this.orders[side]) {
        const tile = { id, side },
          r = this.rect(tile),
          pose = this.pose(tile);
        const done = model.matched.has(id);
        const selected = model.selected?.id === id && model.selected.side === side;
        const hint =
          model.hints.get(id) === side ||
          (this.temporaryHint?.id === id && this.temporaryHint.side === side);
        const color = SHAPES.find((s) => s.id === id)!.color;

        if (selected) {
          g.fillStyle(0xfff3b0, 0.95).fillCircle(pose.x, pose.y, r.width * 0.48);
          g.lineStyle(Math.max(r.width * 0.035, 4), 0xffb400, 1).strokeCircle(
            pose.x,
            pose.y,
            r.width * 0.48,
          );
        }
        if (hint)
          g.lineStyle(Math.max(r.width * 0.05, 5), 0xf59e0b, pulse).strokeCircle(
            pose.x,
            pose.y,
            r.width * 0.48,
          );

        if (side === 0) {
          // A shape on the grass, on its own small shadow.
          g.fillStyle(0x2f6b2f, 0.22).fillEllipse(
            pose.x,
            pose.y + pose.size * 0.52,
            pose.size * 0.8,
            pose.size * 0.14,
          );
          drawShape(g, id, pose.x, pose.y, pose.size, color);
        } else {
          // A balloon: white until it is tied to its shape, then that shape's colour.
          const knot = r.width * 0.05;
          if (!done) {
            const end = { x: pose.tie.x + knot * 0.6, y: pose.tie.y + r.width * 0.13 };
            this.drawString(g, pose.tie, end, Math.max(r.width * 0.022, 2), INK, 0.7);
          }
          drawShape(g, id, pose.x, pose.y, pose.size, done ? color : 0xffffff);
          g.fillStyle(done ? color : 0xffffff, 1).fillTriangle(
            pose.tie.x - knot,
            pose.tie.y + knot * 0.4,
            pose.tie.x,
            pose.tie.y - knot * 1.1,
            pose.tie.x + knot,
            pose.tie.y + knot * 0.4,
          );
          g.lineStyle(Math.max(pose.size * 0.035, 2.5), INK, 1).strokeTriangle(
            pose.tie.x - knot,
            pose.tie.y + knot * 0.4,
            pose.tie.x,
            pose.tie.y - knot * 1.1,
            pose.tie.x + knot,
            pose.tie.y + knot * 0.4,
          );
        }
      }
  }

  view() {
    const button = (b: PairButton | undefined) =>
      b
        ? {
            x: b.x,
            y: b.y,
            visible: b.visible,
            enabled: b.input?.enabled ?? false,
            size: b.width * b.scaleX,
          }
        : null;
    return {
      ready: this.initialized,
      menuOpen: this.menuOpen,
      locale: this.locale,
      selectedLevel: this.progress.level,
      level: this.roundLevel,
      round: this.roundIndex,
      completed: this.completed,
      selected: this.model?.selected ?? null,
      matched: [...(this.model?.matched ?? [])],
      wrongTries: this.model?.wrongTries ?? 0,
      hints: [...(this.model?.hints.entries() ?? [])],
      temporaryHint: this.temporaryHint,
      preview: this.preview,
      reducedMotion: this.reducedMotion,
      sound: this.soundEnabled,
      saveStatus: this.saveStatus,
      groups: this.geometry
        ? this.orders.map((ids, side) =>
            ids.map((id) => {
              const rect = this.rect({ id, side: side as Side });
              return { id, side, ...center(rect), rect, done: this.model!.matched.has(id) };
            }),
          )
        : [],
      lines: this.geometry
        ? [...this.model!.matched].map((id) => ({
            id,
            from: center(this.rect({ id, side: 0 })),
            to: center(this.rect({ id, side: 1 })),
          }))
        : [],
      buttons: {
        hint: this.menu?.buttonView("game-hint") ?? null,
        sound: this.menu?.buttonView("game-sound") ?? null,
        next: button(this.nextButton),
      },
    };
  }
}
