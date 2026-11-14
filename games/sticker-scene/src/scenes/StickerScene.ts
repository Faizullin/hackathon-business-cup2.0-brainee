// biome-ignore-all lint/style/noNonNullAssertion: ported GSP source; lookups are guarded by the scene lifecycle
import { BridgedScene } from "@brainee/engine-phaser/bridge";
import { celebrate } from "@brainee/engine-phaser/celebrate";
import {
  DragToTarget,
  PLACED_DEPTH,
  type Placement,
  RESTING_DEPTH,
} from "@brainee/engine-phaser/dragToTarget";
import { confetti } from "@brainee/engine-phaser/effects";
import { computeLayout, MAX_VISIBLE_SLOTS, type PuzzleLayout } from "@brainee/engine-phaser/layout";
import { seededRandom } from "@brainee/engine-phaser/random";
import { type Point, shouldGlowHint } from "@brainee/engine-phaser/snap";
import { playReturnSound, playSnapSound, playVictorySound } from "@brainee/engine-phaser/sounds";
import { RoundButton } from "@brainee/engine-phaser/ui/RoundButton";
import { type GameObjects, type Input, TintModes } from "phaser";
import type { StickerSceneContract } from "../contract";
import type { StickerLevel } from "../game/levels";
import { reachSide, stickerAt, stickerCenter, stickerSide } from "../game/placement";
import { advanceProgress, parseProgress, type StickerProgress } from "../game/progress";
import { clampTrayPage, pickRound, trayPageCount } from "../game/round";
import {
  backgroundKey,
  backgroundUrl,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  SCENES,
  type SceneDef,
  type StickerDef,
  stickerKey,
  stickerUrl,
} from "../game/scenes";
import {
  configuredLevel,
  missingFromProgress,
  PREFERENCES_KEY,
  parseMissing,
} from "../game/settings";
import { COPY, type GameLocale, resolveLocale } from "../i18n";
import { GameMenu } from "../ui/GameMenu";

/** Opened without a host: `?level=&scene=&seed=` (1-based level, 0-based scene). */
function roundFromUrl(): { progress: Partial<StickerProgress>; seed: number | null } {
  const params = new URLSearchParams(window.location.search);
  const seed = params.get("seed");
  return {
    progress: { level: Number(params.get("level") ?? 1), scene: Number(params.get("scene") ?? 0) },
    seed: seed === null ? null : Number(seed) || 0,
  };
}

/** A sticker the child still has to place. */
interface Entry {
  def: StickerDef;
  image: GameObjects.Image;
  /** Its place in the scene: a dark edge, the white silhouette and (level 1) the faint sticker. */
  place: GameObjects.Image[];
  /** Where it rests in the tray; `null` on another tray page. */
  home: Placement | null;
  wrongDrops: number;
}

interface Round {
  scene: SceneDef;
  level: StickerLevel;
  entries: Map<string, Entry>;
  /** Ids still in the tray, in tray order. */
  tray: string[];
  /** Stickers in the scene: the ones that started there, then each placed one. */
  placed: { def: StickerDef; image: GameObjects.Image }[];
}

/** Pixels a press must move before it becomes a drag; less is a tap. */
const DRAG_THRESHOLD = 8;
const SILHOUETTE_DEPTH = 5;
const GLOW_DEPTH = 15;
const BUTTON_DEPTH = 50;
/** How long the "?" hint glows when nothing was dropped wrongly. */
const HINT_MS = 2500;

/**
 * The sticker scene: drag (or tap, then tap the silhouette) each tray sticker
 * onto the silhouette with its outline. Snaps are forgiving, wrong drops glide
 * back, a right answer is celebrated with confetti, and a finished scene saves
 * progress. Nothing is spoken.
 */
export class StickerScene extends BridgedScene<StickerSceneContract> {
  private round: Round | null = null;
  private progress: StickerProgress = { level: 1, scene: 0, solvedAtLevel: 0 };
  private currentLayout: PuzzleLayout | null = null;
  private reducedMotion = false;
  /** Pins the round's stickers (`?seed=`); otherwise every round shuffles anew. */
  private fixedSeed: number | null = null;
  /** Counts `create()` runs, so a load that outlives a restart starts nothing. */
  private run = 0;

  private drag!: DragToTarget<GameObjects.Image>;
  private card!: GameObjects.Graphics;
  private background!: GameObjects.Image;
  private selectionRing!: GameObjects.Graphics;
  private hintGlow!: GameObjects.Graphics;

  private trayPage = 0;
  private wrongDrops = 0;
  /** The sticker whose silhouette glows, and whether it glows until it lands. */
  private glowId: string | null = null;
  private glowUntilPlaced = false;
  private startTime = Date.now();
  private isCompleted = false;
  private isSoundEnabled = true;

  private menu!: GameMenu;
  private menuOpen = true;
  private initialized = false;
  private missing = 3;
  private locale: GameLocale = "en";
  private appliedHostLocale: string | null = null;
  private menuOpenedAt = 0;
  private hintTimer: Phaser.Time.TimerEvent | null = null;
  private fadingPlaces = new Set<GameObjects.Image>();
  private prevTrayBtn!: RoundButton;
  private nextTrayBtn!: RoundButton;
  private nextBtn: RoundButton | null = null;

  constructor() {
    super("StickerScene");
  }

  preload() {
    for (const scene of SCENES) {
      this.load.image(backgroundKey(scene), backgroundUrl(scene));
      for (const sticker of scene.stickers)
        this.load.image(stickerKey(scene, sticker), stickerUrl(scene, sticker));
    }
  }

  async create() {
    const run = ++this.run;
    this.round = null;
    this.currentLayout = null;
    this.nextBtn = null;
    this.initialized = false;
    this.menuOpen = true;
    this.appliedHostLocale = null;
    this.input.enabled = false;
    this.reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    this.input.dragDistanceThreshold = DRAG_THRESHOLD;

    this.card = this.add.graphics();
    this.background = this.add
      .image(0, 0, backgroundKey(SCENES[0]))
      .setOrigin(0)
      .setDepth(1)
      .setVisible(false);
    this.selectionRing = this.add.graphics().setDepth(RESTING_DEPTH - 1);
    this.hintGlow = this.add.graphics().setDepth(GLOW_DEPTH);
    this.createControls();

    this.drag = new DragToTarget<GameObjects.Image>({
      scene: this,
      reducedMotion: this.reducedMotion,
      enabled: () =>
        Boolean(this.round) && !this.isCompleted && !this.menuOpen && !this.game.isPaused,
      target: (image) => this.targetOf(this.entryOf(image).def),
      home: (image) => this.entryOf(image).home ?? { x: image.x, y: image.y, scale: image.scale },
      snapSize: (image) => {
        const side = this.currentLayout
          ? reachSide(this.currentLayout.board, this.entryOf(image).def)
          : 0;
        return { width: side, height: side };
      },
      onSelect: () => this.drawSelection(),
      onSnap: (image) => this.onPlaced(this.entryOf(image)),
      onMiss: (image, drop) => this.onRejected(this.entryOf(image), drop),
    });

    this.scale.on("resize", this.layout, this);
    // A tap on a silhouette places the selected sticker; taps on stickers and buttons are theirs.
    this.input.on("pointerdown", (pointer: Input.Pointer, over: GameObjects.GameObject[]) => {
      if (over.length === 0) this.handleSceneTap(pointer);
    });
    // The host's restart runs create() again on this same scene: leave nothing behind.
    const syncControls = () => this.menu?.setState(this.isCompleted, this.game.isPaused);
    this.game.events.on("pause", syncControls);
    this.game.events.on("resume", syncControls);
    const stopConfig = this.bridge.onConfig(() => {
      if (
        !this.bridge.bridged ||
        !this.bridge.context ||
        this.appliedHostLocale === this.bridge.context.locale
      )
        return;
      this.appliedHostLocale = this.bridge.context.locale;
      this.applyLocale(resolveLocale(this.appliedHostLocale, null, null, []));
    });
    this.events.once("shutdown", () => {
      ++this.run;
      this.scale.off("resize", this.layout, this);
      this.game.events.off("pause", syncControls);
      this.game.events.off("resume", syncControls);
      stopConfig();
      this.menu?.destroy();
      this.hintTimer?.remove();
      this.hintTimer = null;
      this.fadingPlaces.clear();
      this.time.paused = false;
      this.tweens.resumeAll();
      this.round = null;
    });

    const url = roundFromUrl();
    this.fixedSeed = url.seed;
    const saved = /* Explore preview: the host keeps no game progress (no learning writes). */ null;
    if (run !== this.run) return;
    const preferences = this.readPreferences();
    const params = new URLSearchParams(window.location.search);
    const fallback = this.bridge.bridged
      ? preferences
      : {
          ...preferences,
          ...Object.fromEntries(
            ["level", "scene"]
              .filter((key) => params.has(key))
              .map((key) => [key, Number(params.get(key))]),
          ),
        };
    this.progress = parseProgress(saved ?? fallback, SCENES.length);
    this.missing = saved
      ? missingFromProgress(saved)
      : !this.bridge.bridged && params.has("missing")
        ? parseMissing(Number(params.get("missing")))
        : !this.bridge.bridged && params.has("level")
          ? missingFromProgress(url.progress)
          : parseMissing(preferences.missing);
    this.isSoundEnabled = typeof preferences.sound === "boolean" ? preferences.sound : true;
    this.locale = resolveLocale(
      this.bridge.bridged ? this.bridge.context?.locale : null,
      params.get("lang"),
      preferences.locale,
      navigator.languages,
    );
    this.appliedHostLocale = this.bridge.bridged ? (this.bridge.context?.locale ?? null) : null;
    this.menu = new GameMenu(this.locale, this.isSoundEnabled, {
      start: (scene, missing) => {
        if (this.game.isPaused) return;
        this.progress = { ...this.progress, scene };
        this.missing = missing;
        this.savePreferences();
        this.closeMenu();
        this.startRound(this.progress);
      },
      resume: () => {
        if (!this.game.isPaused) this.closeMenu();
      },
      menu: () => {
        if (!this.game.isPaused) this.openMenu();
      },
      hint: () => this.showHint(),
      sound: (enabled) => {
        this.isSoundEnabled = enabled;
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

  private createControls() {
    const arrow = { radius: 18, fontSize: 12 };
    this.prevTrayBtn = new RoundButton(this, 0, 0, {
      ...arrow,
      onClick: () => this.turnTrayPage(-1),
    })
      .setDepth(BUTTON_DEPTH)
      .setVisible(false);
    this.nextTrayBtn = new RoundButton(this, 0, 0, {
      ...arrow,
      onClick: () => this.turnTrayPage(1),
    })
      .setDepth(BUTTON_DEPTH)
      .setVisible(false);
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
          scene: this.progress.scene,
          missing: this.missing,
          locale: this.locale,
          sound: this.isSoundEnabled,
        }),
      );
    } catch {
      /* Embedded games may have no access to browser storage. */
    }
  }

  private applyLocale(locale: GameLocale) {
    this.locale = locale;
    document.documentElement.lang = locale;
    document.title = COPY[locale].title;
    this.menu?.setLocale(locale);
  }

  private openMenu() {
    if (this.drag.dragging) return;
    this.menuOpen = true;
    this.menuOpenedAt = Date.now();
    this.input.enabled = false;
    this.time.paused = true;
    this.tweens.pauseAll();
    const currentScene =
      this.round && !this.isCompleted ? SCENES.indexOf(this.round.scene) : this.progress.scene;
    this.menu.open(
      currentScene,
      this.missing,
      Boolean(this.round) && !this.isCompleted,
      Boolean(this.round),
    );
    this.menu.setState(this.isCompleted, this.game.isPaused);
  }

  private closeMenu() {
    if (this.round) this.startTime += Date.now() - this.menuOpenedAt;
    this.menuOpen = false;
    this.input.enabled = true;
    this.time.paused = false;
    this.tweens.resumeAll();
    this.menu.close();
  }

  private startRound(progress: StickerProgress) {
    this.hintTimer?.remove();
    this.hintTimer = null;
    const destroy = (image: GameObjects.Image) => {
      this.tweens.killTweensOf(image);
      if (image.active) image.destroy();
    };
    for (const image of this.fadingPlaces) destroy(image);
    this.fadingPlaces.clear();
    if (this.round) {
      for (const { image } of this.round.placed) destroy(image);
      for (const entry of this.round.entries.values()) {
        destroy(entry.image);
        for (const image of entry.place) destroy(image);
      }
    }
    this.drag.clear();
    this.isCompleted = false;
    this.menu.setState(false, this.game.isPaused);
    this.startTime = Date.now();
    this.wrongDrops = 0;
    this.trayPage = 0;
    this.setGlow(null);
    this.nextBtn?.destroy();
    this.nextBtn = null;

    const scene = SCENES[progress.scene];
    const level = configuredLevel(progress.level, this.missing);
    const random = seededRandom(this.fixedSeed ?? Math.floor(Math.random() * 2 ** 32));
    const inPlay = pickRound(scene.stickers, level, random);

    const entries = new Map<string, Entry>();
    const placed: Round["placed"] = [];
    for (const def of scene.stickers) {
      const key = stickerKey(scene, def);
      if (!inPlay.includes(def)) {
        placed.push({ def, image: this.add.image(0, 0, key).setDepth(PLACED_DEPTH) });
        continue;
      }
      const place = [
        this.add
          .image(0, 0, key)
          .setTint(0x0f172a)
          .setTintMode(TintModes.FILL)
          .setAlpha(0.3)
          .setDepth(SILHOUETTE_DEPTH - 1),
        this.add
          .image(0, 0, key)
          .setTint(0xffffff)
          .setTintMode(TintModes.FILL)
          .setDepth(SILHOUETTE_DEPTH),
      ];
      if (level.fadedSticker)
        place.push(
          this.add
            .image(0, 0, key)
            .setAlpha(0.22)
            .setDepth(SILHOUETTE_DEPTH + 1),
        );
      const image = this.add.image(0, 0, key).setData("sticker", def.id);
      this.drag.add(image);
      entries.set(def.id, { def, image, place, home: null, wrongDrops: 0 });
    }

    this.round = { scene, level, entries, tray: inPlay.map((def) => def.id), placed };
    this.background.setTexture(backgroundKey(scene)).setVisible(true);
    this.layout();

    this.bridge.track("scene_started", {
      level: level.level,
      scene: scene.id,
      stickers: [...this.round.tray],
    });
    this.bridge.state.set("level", level.level);
    this.bridge.state.set("total", inPlay.length);
    this.bridge.state.set("placed", 0);
    this.bridge.lifecycle("started");
  }

  private entryOf(image: GameObjects.Image): Entry {
    return this.round!.entries.get(image.getData("sticker") as string)!;
  }

  /** Where a sticker belongs in the scene, as the layout is now. */
  private targetOf(def: StickerDef, image?: GameObjects.Image): Placement {
    const board = this.currentLayout!.board;
    const frame = (image ?? this.round!.entries.get(def.id)!.image).frame;
    return {
      ...stickerCenter(board, def),
      scale: stickerSide(board, def) / Math.max(frame.width, frame.height),
    };
  }

  /** The stickers still to place, for finding which silhouette a point is on. */
  private openStickers(): StickerDef[] {
    const round = this.round!;
    return round.tray.map((id) => round.entries.get(id)!.def);
  }

  private onPlaced(entry: Entry) {
    const round = this.round;
    if (!round || !this.currentLayout) return;
    const { def, image } = entry;
    const target = this.targetOf(def);

    round.tray.splice(round.tray.indexOf(def.id), 1);
    round.placed.push({ def, image });
    entry.home = null;
    for (const part of entry.place) {
      this.fadingPlaces.add(part);
      this.tweens.add({
        targets: part,
        alpha: 0,
        duration: this.reducedMotion ? 0 : 200,
        onComplete: () => {
          this.fadingPlaces.delete(part);
          part.destroy();
        },
      });
    }
    entry.place = [];
    if (this.glowId === def.id) this.setGlow(null);

    if (this.isSoundEnabled) playSnapSound();
    // The PECS web app's celebration for a right answer (it skips itself under reduced motion).
    celebrate(target, this.currentLayout.board);

    this.bridge.track("sticker_placed", { sticker: def.id, attempts: entry.wrongDrops + 1 });
    this.bridge.state.set("placed", round.entries.size - round.tray.length);

    this.trayPage = clampTrayPage(this.trayPage, round.tray.length, MAX_VISIBLE_SLOTS);
    if (round.tray.length === 0) this.onVictory();
    else this.layout();
  }

  private onRejected(entry: Entry, drop: Point) {
    if (!this.round || !this.currentLayout) return;
    entry.wrongDrops++;
    this.wrongDrops++;
    if (shouldGlowHint(entry.wrongDrops)) this.setGlow(entry.def.id, true);
    if (this.isSoundEnabled) playReturnSound();

    const others = this.openStickers().filter((def) => def !== entry.def);
    const wrong = stickerAt(drop, this.currentLayout.board, others);
    this.bridge.track("sticker_rejected", {
      sticker: entry.def.id,
      ...(wrong ? { onSilhouette: wrong.id } : {}),
    });
  }

  /** A tap on a silhouette while a sticker is selected: right place or wrong one. */
  private handleSceneTap(pointer: Input.Pointer) {
    const selected = this.drag.selected;
    if (
      !this.round ||
      !this.currentLayout ||
      !selected ||
      this.isCompleted ||
      this.menuOpen ||
      this.game.isPaused
    )
      return;
    const tapped = stickerAt(pointer, this.currentLayout.board, this.openStickers());
    if (!tapped) return;
    if (tapped === this.entryOf(selected).def) this.drag.place(selected);
    else this.drag.miss(selected, { x: pointer.x, y: pointer.y });
  }

  /** "?" glows the silhouette of the selected sticker, or of the first one in the tray. */
  private showHint() {
    const round = this.round;
    if (
      !round ||
      this.isCompleted ||
      round.tray.length === 0 ||
      this.menuOpen ||
      this.game.isPaused
    )
      return;
    const selected = this.drag.selected;
    const id = selected
      ? this.entryOf(selected).def.id
      : (this.glowId ?? round.tray[this.trayPage * MAX_VISIBLE_SLOTS] ?? round.tray[0]);
    this.bridge.track("hint_shown", { sticker: id });
    if (this.glowId === id && this.glowUntilPlaced) return;
    this.setGlow(id, false);
    this.hintTimer?.remove();
    this.hintTimer = this.time.delayedCall(HINT_MS, () => {
      if (this.glowId === id && !this.glowUntilPlaced) this.setGlow(null);
    });
  }

  /** A pulsing ring around a sticker's silhouette; `null` turns it off. */
  private setGlow(id: string | null, untilPlaced = false) {
    this.glowId = id;
    this.glowUntilPlaced = id !== null && untilPlaced;
    this.tweens.killTweensOf(this.hintGlow);
    this.drawGlow();
    if (id === null || this.reducedMotion) return;
    this.tweens.add({
      targets: this.hintGlow,
      alpha: { from: 1, to: 0.35 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    });
  }

  private drawGlow() {
    this.hintGlow.clear().setAlpha(1);
    const entry = this.glowId === null ? undefined : this.round?.entries.get(this.glowId);
    if (!entry || !this.currentLayout) return;
    const board = this.currentLayout.board;
    const center = stickerCenter(board, entry.def);
    this.hintGlow
      .lineStyle(6, 0xf59e0b, 1)
      .strokeCircle(center.x, center.y, stickerSide(board, entry.def) * 0.56);
  }

  /** A soft disc behind the sticker a tap picked. */
  private drawSelection() {
    this.selectionRing.clear();
    const selected = this.drag?.selected;
    const home = selected && this.round ? this.entryOf(selected).home : null;
    if (!selected || !home) return;
    const radius = (Math.max(selected.frame.width, selected.frame.height) * home.scale) / 2 + 6;
    this.selectionRing.fillStyle(0xfde68a, 0.9).fillCircle(home.x, home.y, radius);
    this.selectionRing.lineStyle(3, 0xf59e0b, 1).strokeCircle(home.x, home.y, radius);
  }

  private onVictory() {
    if (!this.round || this.isCompleted) return;
    this.isCompleted = true;
    this.menu.setState(true, this.game.isPaused);
    this.setGlow(null);

    if (this.isSoundEnabled) playVictorySound();
    if (!this.reducedMotion && this.currentLayout) confetti(this, this.currentLayout.board);

    this.bridge.track("scene_completed", {
      durationMs: Date.now() - this.startTime,
      wrongDrops: this.wrongDrops,
    });
    this.progress = advanceProgress(this.progress, SCENES.length);
    this.savePreferences();

    this.nextBtn = new RoundButton(this, 0, 0, {
      radius: 32,
      label: "➔",
      fontSize: 24,
      bgColor: 0x22c55e,
      textColor: "#ffffff",
      strokeColor: 0x16a34a,
      strokeWidth: 3,
      onClick: () => this.startRound(this.progress),
    }).setDepth(BUTTON_DEPTH + 10);
    if (!this.reducedMotion) {
      this.tweens.add({
        targets: this.nextBtn,
        scale: { from: 0.6, to: 1 },
        duration: 300,
        ease: "Back.easeOut",
      });
    }
    this.layout();
  }

  private turnTrayPage(step: number) {
    if (!this.round) return;
    this.drag.select(null);
    this.trayPage = clampTrayPage(this.trayPage + step, this.round.tray.length, MAX_VISIBLE_SLOTS);
    this.layout();
  }

  private layout() {
    const round = this.round;
    if (!round) return;
    const { width, height } = this.scale.gameSize;
    const layout = computeLayout({
      width,
      height,
      pictureWidth: SCENE_WIDTH,
      pictureHeight: SCENE_HEIGHT,
      columns: 1,
      rows: 1,
      // The tray keeps its space after the last sticker so the scene doesn't jump.
      visibleSlots: Math.min(Math.max(round.tray.length, 1), MAX_VISIBLE_SLOTS),
      paged: round.tray.length > MAX_VISIBLE_SLOTS,
    });
    this.currentLayout = layout;
    const { board, tray } = layout;

    this.card.clear();
    this.card
      .fillStyle(0x000000, 0.08)
      .fillRoundedRect(board.x - 6, board.y, board.width + 12, board.height + 14, 18);
    this.card
      .fillStyle(0xffffff, 1)
      .fillRoundedRect(board.x - 8, board.y - 8, board.width + 16, board.height + 16, 18);
    if (tray.width > 0 && tray.height > 0) {
      this.card
        .fillStyle(0xe2e8f0, 0.5)
        .fillRoundedRect(tray.x, tray.y, tray.width, tray.height, 14);
    }
    this.background.setPosition(board.x, board.y).setScale(layout.scale);

    for (const { def, image } of round.placed) {
      if (this.drag.isBusy(image)) continue;
      const target = this.targetOf(def, image);
      image
        .setPosition(target.x, target.y)
        .setScale(target.scale)
        .setAngle(0)
        .setDepth(PLACED_DEPTH);
    }
    for (const entry of round.entries.values()) {
      const target = this.targetOf(entry.def);
      for (const [index, part] of entry.place.entries()) {
        // The dark edge is a little larger than the silhouette it sits under.
        part.setPosition(target.x, target.y).setScale(target.scale * (index === 0 ? 1.05 : 1));
      }
    }
    this.placeTray(layout, round);
    this.drawGlow();
    this.drawSelection();

    this.placePagingButtons(layout, round.tray.length);
    this.nextBtn?.setPosition(tray.x + tray.width / 2, tray.y + tray.height / 2);
  }

  private placeTray(layout: PuzzleLayout, round: Round) {
    const first = this.trayPage * MAX_VISIBLE_SLOTS;
    round.tray.forEach((id, position) => {
      const entry = round.entries.get(id)!;
      const { image } = entry;
      const slot = layout.slots[position - first];
      if (position < first || !slot) {
        entry.home = null;
        if (!this.drag.isBusy(image)) image.setVisible(false);
        return;
      }
      entry.home = {
        x: slot.x + slot.width / 2,
        y: slot.y + slot.height / 2,
        scale: (slot.width * 0.86) / Math.max(image.frame.width, image.frame.height),
      };
      if (this.drag.isBusy(image)) return;
      image
        .setPosition(entry.home.x, entry.home.y)
        .setScale(entry.home.scale)
        .setAngle(0)
        .setVisible(true)
        .setDepth(RESTING_DEPTH);
    });
  }

  private placePagingButtons(layout: PuzzleLayout, inTray: number) {
    const pages = trayPageCount(inTray, MAX_VISIBLE_SLOTS);
    const arrows = layout.arrows;
    const show = Boolean(arrows) && pages > 1 && !this.isCompleted;
    this.prevTrayBtn.setVisible(show);
    this.nextTrayBtn.setVisible(show);
    if (!show || !arrows) return;
    const landscape = layout.orientation === "landscape";
    this.prevTrayBtn
      .setLabel(landscape ? "▲" : "◀")
      .setPosition(arrows.previous.x, arrows.previous.y);
    this.nextTrayBtn.setLabel(landscape ? "▼" : "▶").setPosition(arrows.next.x, arrows.next.y);
    this.prevTrayBtn.setEnabled(this.trayPage > 0);
    this.nextTrayBtn.setEnabled(this.trayPage < pages - 1);
  }

  /** A plain snapshot of the round, for checks; the game itself doesn't use it. */
  view() {
    const round = this.round;
    const at = (object: { x: number; y: number } | null) =>
      object ? { x: object.x, y: object.y } : null;
    const button = (found: RoundButton | null) =>
      found ? { x: found.x, y: found.y, visible: found.visible, enabled: found.alpha === 1 } : null;
    const selected = this.drag?.selected;
    return {
      ready: this.initialized,
      menuOpen: this.menuOpen,
      missing: this.missing,
      locale: this.locale,
      sound: this.isSoundEnabled,
      scene: round?.scene.id ?? null,
      level: round?.level.level ?? null,
      completed: this.isCompleted,
      trayPage: this.trayPage,
      selected: selected ? this.entryOf(selected).def.id : null,
      glow: this.glowId,
      tray: (round?.tray ?? []).map((id) => {
        const { image, home } = round!.entries.get(id)!;
        return {
          id,
          x: image.x,
          y: image.y,
          shown: home !== null,
          target: at(this.targetOf(round!.entries.get(id)!.def)),
        };
      }),
      placed: (round?.placed ?? []).map(({ def, image }) => ({
        id: def.id,
        x: image.x,
        y: image.y,
        target: at(this.targetOf(def, image)),
      })),
      buttons: {
        hint: this.menu?.buttonView("game-hint") ?? null,
        previous: button(this.prevTrayBtn),
        next: button(this.nextTrayBtn),
        nextRound: button(this.nextBtn),
      },
    };
  }
}
