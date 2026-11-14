// biome-ignore-all lint/style/noNonNullAssertion: ported GSP source; lookups are guarded by the scene lifecycle
import { BridgedScene } from "@brainee/engine-phaser/bridge";
import { celebrate } from "@brainee/engine-phaser/celebrate";
import { type Placement, RESTING_DEPTH } from "@brainee/engine-phaser/dragToTarget";
import { DragToZone } from "@brainee/engine-phaser/dragToZone";
import { confetti } from "@brainee/engine-phaser/effects";
import {
  computeLayout,
  MAX_VISIBLE_SLOTS,
  type PuzzleLayout,
  type Rect,
} from "@brainee/engine-phaser/layout";
import { seededRandom } from "@brainee/engine-phaser/random";
import { shouldGlowHint } from "@brainee/engine-phaser/snap";
import { playReturnSound, playSnapSound, playVictorySound } from "@brainee/engine-phaser/sounds";
import { RoundButton } from "@brainee/engine-phaser/ui/RoundButton";
import type { GameObjects, Input } from "phaser";
import type { ColorSortContract } from "../contract";
import { type BoxPlace, boxAt, boxPlaces, slotCenter } from "../game/boxes";
import {
  BACKGROUND_KEY,
  BACKGROUND_URL,
  COLORS,
  type ColorDef,
  type ItemDef,
  itemKey,
  itemUrl,
  type Pattern,
  SCENE_HEIGHT,
  SCENE_WIDTH,
} from "../game/colors";
import type { SortLevel } from "../game/levels";
import { advanceProgress, parseProgress, type SortProgress } from "../game/progress";
import { clampTrayPage, pickRound, trayPageCount } from "../game/round";
import {
  configuredLevel,
  DEFAULT_SETTINGS,
  PREFERENCES_KEY,
  parseSettings,
  type SortSettings,
  settingsFromProgress,
} from "../game/settings";
import { COPY, type GameLocale, resolveLocale } from "../i18n";
import { GameMenu } from "../ui/GameMenu";

/** Opened without a host: `?level=&seed=` (1-based level). */
function roundFromUrl(): { progress: Partial<SortProgress>; seed: number | null } {
  const params = new URLSearchParams(window.location.search);
  const seed = params.get("seed");
  return {
    progress: { level: Number(params.get("level") ?? 1) },
    seed: seed === null ? null : Number(seed) || 0,
  };
}

/** A picture in the round: in the tray, or in a box. */
interface Entry {
  def: ItemDef;
  image: GameObjects.Image;
  /** Where it rests in the tray; `null` on another tray page or once sorted. */
  home: Placement | null;
  wrongDrops: number;
  /** Its box and place in it, once sorted (or from the start, for an example). */
  box: number | null;
  slot: number;
}

interface Box {
  color: ColorDef;
  back: GameObjects.Graphics;
  front: GameObjects.Graphics;
  label: GameObjects.Text;
  /** Ids of the pictures in it, in slot order. */
  contents: string[];
}

interface Round {
  level: SortLevel;
  boxes: Box[];
  entries: Map<string, Entry>;
  /** Ids still in the tray, in tray order. */
  tray: string[];
}

/** Pixels a press must move before it becomes a drag; less is a tap. */
const DRAG_THRESHOLD = 8;
const BOX_BACK_DEPTH = 5;
const BACK_ROW_DEPTH = 9;
const FRONT_ROW_DEPTH = 10;
const BOX_FRONT_DEPTH = 12;
const GLOW_DEPTH = 15;
const BUTTON_DEPTH = 50;
/** How far a box rises while a picture is held over it. */
const HOVER_LIFT = 6;
/** How long the "?" hint glows when nothing was dropped wrongly. */
const HINT_MS = 2500;

/**
 * Color Boxes: drag (or tap, then tap the box) each tray picture into the toy
 * box of its colour. Any free spot in the right box counts; a wrong box sends
 * the picture back gently, a right one is celebrated, and a finished round
 * saves progress. Nothing is spoken.
 */
export class ColorSortScene extends BridgedScene<ColorSortContract> {
  private round: Round | null = null;
  private progress: SortProgress = { level: 1, solvedAtLevel: 0 };
  private currentLayout: PuzzleLayout | null = null;
  private boxPlaces: BoxPlace[] = [];
  private reducedMotion = false;
  /** Pins the round (`?seed=`); otherwise every round shuffles anew. */
  private fixedSeed: number | null = null;
  /** Counts `create()` runs, so a load that outlives a restart starts nothing. */
  private run = 0;

  private drag!: DragToZone<GameObjects.Image, number>;
  private card!: GameObjects.Graphics;
  private background!: GameObjects.Image;
  private selectionRing!: GameObjects.Graphics;
  private hintGlow!: GameObjects.Graphics;

  private trayPage = 0;
  private wrongDrops = 0;
  private hoverBox: number | null = null;
  /** The colour whose box glows, and whether it glows until its picture lands. */
  private glowColor: string | null = null;
  private glowItem: string | null = null;
  private glowUntilPlaced = false;
  private startTime = Date.now();
  private isCompleted = false;

  private prevTrayBtn!: RoundButton;
  private nextTrayBtn!: RoundButton;
  private nextBtn: RoundButton | null = null;
  private isSoundEnabled = true;
  private menu!: GameMenu;
  private menuOpen = true;
  private locale: GameLocale = "en";
  private settings: SortSettings = { ...DEFAULT_SETTINGS };
  private initialized = false;
  private menuOpenedAt = 0;
  private hintTimer: Phaser.Time.TimerEvent | null = null;
  private appliedHostLocale: string | null = null;

  constructor() {
    super("ColorSortScene");
  }

  preload() {
    this.load.image(BACKGROUND_KEY, BACKGROUND_URL);
    for (const color of COLORS) {
      for (const item of color.items) this.load.image(itemKey(item), itemUrl(item));
    }
  }

  async create() {
    const run = ++this.run;
    this.round = null;
    this.currentLayout = null;
    this.nextBtn = null;
    this.hoverBox = null;
    this.initialized = false;
    this.menuOpen = true;
    this.input.enabled = false;
    this.appliedHostLocale = null;
    this.reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    this.input.dragDistanceThreshold = DRAG_THRESHOLD;

    this.card = this.add.graphics();
    this.background = this.add.image(0, 0, BACKGROUND_KEY).setOrigin(0).setDepth(1);
    this.selectionRing = this.add.graphics().setDepth(RESTING_DEPTH - 1);
    this.hintGlow = this.add.graphics().setDepth(GLOW_DEPTH);
    this.createControls();

    this.drag = new DragToZone<GameObjects.Image, number>({
      scene: this,
      reducedMotion: this.reducedMotion,
      enabled: () => Boolean(this.round) && !this.isCompleted && !this.menuOpen,
      zoneAt: (point) => boxAt(point, this.boxPlaces),
      accepts: (image, box) => this.round!.boxes[box].color.id === this.entryOf(image).def.color,
      destination: (image) => this.slotPlacement(this.entryOf(image)),
      home: (image) => this.entryOf(image).home ?? { x: image.x, y: image.y, scale: image.scale },
      onSelect: () => this.drawSelection(),
      onHover: (box) => {
        this.hoverBox = box;
        this.layout();
      },
      onPlace: (image, box) => this.onSorted(this.entryOf(image), box),
      onMiss: (image, box) => this.onRejected(this.entryOf(image), box),
    });

    this.scale.on("resize", this.layout, this);
    // A tap on a box drops the selected picture there; taps on pictures and buttons are theirs.
    this.input.on("pointerdown", (pointer: Input.Pointer, over: GameObjects.GameObject[]) => {
      if (over.length === 0) this.handleSceneTap(pointer);
    });
    // The host's restart runs create() again on this same scene: leave nothing behind.
    const syncHostLocale = () => {
      if (!this.bridge.bridged || !this.bridge.context) return;
      const locale = this.bridge.context.locale;
      if (locale === this.appliedHostLocale) return;
      this.appliedHostLocale = locale;
      this.applyLocale(resolveLocale(locale, null, null, []));
    };
    const stopConfig = this.bridge.onConfig(syncHostLocale);
    this.events.once("shutdown", () => {
      ++this.run;
      this.scale.off("resize", this.layout, this);
      stopConfig();
      this.menu?.destroy();
      this.hintTimer?.remove();
      this.hintTimer = null;
      this.time.paused = false;
      this.tweens.resumeAll();
      this.round = null;
    });

    const url = roundFromUrl();
    this.fixedSeed = url.seed;
    const preferences = this.readPreferences();
    const saved = /* Explore preview: the host keeps no game progress (no learning writes). */ null;
    if (run !== this.run) return;
    this.progress = parseProgress(saved ?? url.progress);
    const hasLevel = new URLSearchParams(window.location.search).has("level");
    this.settings = saved
      ? settingsFromProgress(saved)
      : hasLevel
        ? settingsFromProgress(url.progress)
        : parseSettings(preferences.settings);
    this.isSoundEnabled = typeof preferences.sound === "boolean" ? preferences.sound : true;
    this.locale = resolveLocale(
      this.bridge.bridged ? this.bridge.context?.locale : null,
      new URLSearchParams(window.location.search).get("lang"),
      preferences.locale,
      navigator.languages,
    );
    this.appliedHostLocale = this.bridge.bridged ? (this.bridge.context?.locale ?? null) : null;
    this.menu = new GameMenu(this.locale, this.isSoundEnabled, {
      start: (settings) => {
        if (this.game.isPaused) return;
        this.settings = settings;
        this.savePreferences();
        this.closeMenu();
        this.startRound();
      },
      resume: () => {
        if (!this.game.isPaused) this.closeMenu();
      },
      menu: () => this.openMenu(),
      hint: () => {
        if (!this.game.isPaused) this.showHint();
      },
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
          settings: this.settings,
          locale: this.locale,
          sound: this.isSoundEnabled,
        }),
      );
    } catch {
      /* Sandboxed games can run with storage disabled. */
    }
  }

  private applyLocale(locale: GameLocale) {
    this.locale = locale;
    document.documentElement.lang = locale;
    document.title = COPY[locale].title;
    this.menu?.setLocale(locale);
    for (const box of this.round?.boxes ?? []) box.label.setText(this.colorWord(box.color.id));
    this.layout();
  }

  private colorWord(id: string) {
    return COPY[this.locale].colors[id as keyof typeof COPY.en.colors];
  }

  private openMenu() {
    if (this.game.isPaused || this.drag.dragging) return;
    this.menuOpen = true;
    this.menuOpenedAt = Date.now();
    this.input.enabled = false;
    this.time.paused = true;
    this.tweens.pauseAll();
    this.menu.open(this.settings, Boolean(this.round) && !this.isCompleted, Boolean(this.round));
  }

  private closeMenu() {
    if (this.round) this.startTime += Date.now() - this.menuOpenedAt;
    this.menuOpen = false;
    this.input.enabled = true;
    this.time.paused = false;
    this.tweens.resumeAll();
    this.menu.close();
  }

  private startRound() {
    this.hintTimer?.remove();
    this.hintTimer = null;
    if (this.round) {
      for (const entry of this.round.entries.values()) {
        this.tweens.killTweensOf(entry.image);
        entry.image.destroy();
      }
      for (const box of this.round.boxes) {
        box.back.destroy();
        box.front.destroy();
        box.label.destroy();
      }
    }
    this.drag.clear();
    this.isCompleted = false;
    this.startTime = Date.now();
    this.wrongDrops = 0;
    this.trayPage = 0;
    this.hoverBox = null;
    this.setGlow(null);
    this.nextBtn?.destroy();
    this.nextBtn = null;

    const level = configuredLevel(this.settings);
    const random = seededRandom(this.fixedSeed ?? Math.floor(Math.random() * 2 ** 32));
    const picked = pickRound(level, random);

    const boxes: Box[] = picked.colors.map((color) => ({
      color,
      back: this.add.graphics().setDepth(BOX_BACK_DEPTH),
      front: this.add.graphics().setDepth(BOX_FRONT_DEPTH),
      label: this.add
        .text(0, 0, this.colorWord(color.id), {
          fontFamily: "system-ui, sans-serif",
          color: "#5b4636",
        })
        .setOrigin(0.5)
        .setDepth(BOX_FRONT_DEPTH),
      contents: [],
    }));

    const entries = new Map<string, Entry>();
    for (const [index, box] of boxes.entries()) {
      const example = picked.examples.get(box.color.id);
      if (!example) continue;
      const image = this.add.image(0, 0, itemKey(example)).setData("item", example.id);
      entries.set(example.id, {
        def: example,
        image,
        home: null,
        wrongDrops: 0,
        box: index,
        slot: 0,
      });
      box.contents.push(example.id);
    }
    for (const def of picked.items) {
      const image = this.add.image(0, 0, itemKey(def)).setData("item", def.id);
      this.drag.add(image);
      entries.set(def.id, { def, image, home: null, wrongDrops: 0, box: null, slot: 0 });
    }

    this.round = { level, boxes, entries, tray: picked.items.map((def) => def.id) };
    this.layout();

    this.bridge.track("round_started", {
      level: level.level,
      colors: picked.colors.map((color) => color.id),
      items: [...this.round.tray],
      boxes: level.boxes,
      perBox: level.perBox,
      locale: this.locale,
    });
    this.bridge.state.set("level", level.level);
    this.bridge.state.set("total", picked.items.length);
    this.bridge.state.set("sorted", 0);
    this.bridge.lifecycle("started");
  }

  private entryOf(image: GameObjects.Image): Entry {
    return this.round!.entries.get(image.getData("item") as string)!;
  }

  /** Where a sorted picture sits in its box, as the layout is now. */
  private slotPlacement(entry: Entry): Placement {
    const place = this.boxPlaces[entry.box!];
    const lift = entry.box === this.hoverBox ? HOVER_LIFT : 0;
    const center = slotCenter(place, entry.slot);
    const frame = entry.image.frame;
    return {
      x: center.x,
      y: center.y - lift,
      scale: place.itemSide / Math.max(frame.width, frame.height),
    };
  }

  private boxIndexOf(color: string): number {
    return this.round!.boxes.findIndex((box) => box.color.id === color);
  }

  private onSorted(entry: Entry, boxIndex: number) {
    const round = this.round;
    if (!round || !this.currentLayout) return;
    const box = round.boxes[boxIndex];
    entry.box = boxIndex;
    entry.slot = box.contents.length;
    box.contents.push(entry.def.id);
    entry.home = null;
    round.tray.splice(round.tray.indexOf(entry.def.id), 1);
    if (this.glowItem === entry.def.id) this.setGlow(null);

    if (this.isSoundEnabled) playSnapSound();
    // The PECS web app's celebration for a right answer (it skips itself under reduced motion).
    celebrate(this.slotPlacement(entry), this.currentLayout.board);

    this.bridge.track("item_sorted", {
      item: entry.def.id,
      color: entry.def.color,
      attempts: entry.wrongDrops + 1,
    });
    this.bridge.state.set(
      "sorted",
      [...round.entries.values()].filter((e) => e.box !== null).length - this.exampleCount(),
    );

    this.trayPage = clampTrayPage(this.trayPage, round.tray.length, MAX_VISIBLE_SLOTS);
    if (round.tray.length === 0) this.onVictory();
    else this.layout();
  }

  private exampleCount(): number {
    return this.round?.level.example ? this.round.boxes.length : 0;
  }

  private onRejected(entry: Entry, boxIndex: number | null) {
    if (!this.round) return;
    if (this.isSoundEnabled) playReturnSound();
    // Open floor isn't a wrong answer: the picture just goes back.
    if (boxIndex === null) return;
    entry.wrongDrops++;
    this.wrongDrops++;
    if (shouldGlowHint(entry.wrongDrops)) this.setGlow(entry.def.id, true);
    this.bridge.track("item_rejected", {
      item: entry.def.id,
      box: this.round.boxes[boxIndex].color.id,
    });
  }

  /** A tap on a box while a picture is selected drops it there; elsewhere keeps the selection. */
  private handleSceneTap(pointer: Input.Pointer) {
    const selected = this.drag.selected;
    if (!this.round || !selected || this.isCompleted || this.menuOpen) return;
    const point = { x: pointer.x, y: pointer.y };
    if (boxAt(point, this.boxPlaces) === null) return;
    this.drag.drop(selected, point);
  }

  /** "?" glows the right box of the selected picture, or of the first one in the tray. */
  private showHint() {
    const round = this.round;
    if (!round || this.isCompleted || round.tray.length === 0) return;
    const selected = this.drag.selected;
    const id = selected
      ? this.entryOf(selected).def.id
      : (this.glowItem ?? round.tray[this.trayPage * MAX_VISIBLE_SLOTS] ?? round.tray[0]);
    this.bridge.track("hint_shown", { item: id });
    if (this.glowItem === id && this.glowUntilPlaced) return;
    this.setGlow(id, false);
    this.hintTimer?.remove();
    this.hintTimer = this.time.delayedCall(HINT_MS, () => {
      if (this.glowItem === id && !this.glowUntilPlaced) this.setGlow(null);
    });
  }

  /** A pulsing outline around the box a picture belongs in; `null` turns it off. */
  private setGlow(itemId: string | null, untilPlaced = false) {
    this.glowItem = itemId;
    this.glowColor = itemId === null ? null : (this.round?.entries.get(itemId)?.def.color ?? null);
    this.glowUntilPlaced = itemId !== null && untilPlaced;
    this.tweens.killTweensOf(this.hintGlow);
    this.drawGlow();
    if (itemId === null || this.reducedMotion) return;
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
    if (this.glowColor === null || !this.round) return;
    const index = this.boxIndexOf(this.glowColor);
    const place = this.boxPlaces[index];
    if (!place) return;
    const { zone } = place;
    this.hintGlow
      .lineStyle(6, 0xf59e0b, 1)
      .strokeRoundedRect(zone.x, zone.y, zone.width, zone.height, 16);
  }

  /** A soft disc behind the picture a tap picked. */
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
    this.setGlow(null);
    this.hoverBox = null;

    if (this.isSoundEnabled) playVictorySound();
    if (!this.reducedMotion && this.currentLayout) confetti(this, this.currentLayout.board);

    this.bridge.track("round_completed", {
      durationMs: Date.now() - this.startTime,
      wrongDrops: this.wrongDrops,
    });
    this.progress = advanceProgress(this.progress);

    this.nextBtn = new RoundButton(this, 0, 0, {
      radius: 32,
      label: "➔",
      fontSize: 24,
      bgColor: 0x22c55e,
      textColor: "#ffffff",
      strokeColor: 0x16a34a,
      strokeWidth: 3,
      onClick: () => this.startRound(),
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
      // The tray keeps its space after the last picture so the room doesn't jump.
      visibleSlots: Math.min(Math.max(round.tray.length, 1), MAX_VISIBLE_SLOTS),
      paged: round.tray.length > MAX_VISIBLE_SLOTS,
    });
    this.currentLayout = layout;
    this.boxPlaces = boxPlaces(layout.board, round.boxes.length);
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

    for (const [index, box] of round.boxes.entries())
      this.drawBox(box, this.boxPlaces[index], index === this.hoverBox);
    for (const entry of round.entries.values()) {
      if (entry.box === null || this.drag.isBusy(entry.image)) continue;
      const to = this.slotPlacement(entry);
      entry.image
        .setPosition(to.x, to.y)
        .setScale(to.scale)
        .setAngle(0)
        .setVisible(true)
        .setDepth(entry.slot < 2 ? BACK_ROW_DEPTH : FRONT_ROW_DEPTH);
    }
    this.placeTray(layout, round);
    this.drawGlow();
    this.drawSelection();

    this.placePagingButtons(layout, round.tray.length);
    this.nextBtn?.setPosition(tray.x + tray.width / 2, tray.y + tray.height / 2);
  }

  /** An open toy box: its inside behind the pictures, its patterned front over them. */
  private drawBox(box: Box, place: BoxPlace, lifted: boolean) {
    const { color } = box;
    const lift = lifted ? HOVER_LIFT : 0;
    const { x, width, height } = place.body;
    const y = place.body.y - lift;
    const lip = Math.max(height * 0.14, 4);
    const radius = Math.min(width * 0.08, 14);

    box.back.clear();
    // A soft shadow on the rug, then the box's dark inside showing over the front.
    box.back
      .fillStyle(0x000000, lifted ? 0.1 : 0.14)
      .fillEllipse(x + width / 2, place.body.y + height + 2, width * 1.05, height * 0.22);
    box.back
      .fillStyle(color.rim, 1)
      .fillRoundedRect(x + width * 0.03, y - lip * 1.6, width * 0.94, lip * 2.2, radius * 0.7);

    box.front.clear();
    box.front
      .fillStyle(color.fill, 1)
      .fillRoundedRect(x, y, width, height, { tl: 4, tr: 4, bl: radius, br: radius });
    box.front
      .lineStyle(Math.max(width * 0.025, 2), color.rim, 1)
      .strokeRoundedRect(x, y, width, height, { tl: 4, tr: 4, bl: radius, br: radius });
    box.front.fillStyle(color.rim, 1).fillRect(x, y, width, lip);
    this.drawPattern(box.front, color.pattern, color.ink, {
      x: x + width * 0.1,
      y: y + lip + height * 0.1,
      width: width * 0.8,
      height: height - lip - height * 0.24,
    });

    box.label
      .setFontSize(Math.max(Math.round(width * 0.11), 11))
      .setPosition(place.label.x, place.label.y)
      .setScale(1);
    // Long Russian/Kazakh colour names must fit even with four baskets on a phone.
    if (box.label.width > width * 1.12) box.label.setScale((width * 1.12) / box.label.width);
  }

  /** The box's own pattern, inside `area`, so boxes differ even without colour. */
  private drawPattern(g: GameObjects.Graphics, pattern: Pattern, ink: number, area: Rect) {
    const { x, y, width, height } = area;
    const unit = Math.max(Math.min(width, height) / 3.2, 4);
    const stroke = Math.max(unit * 0.22, 1.5);
    g.fillStyle(ink, 0.85);
    g.lineStyle(stroke, ink, 0.85);
    const columns = Math.max(Math.floor(width / unit), 1);
    const rows = Math.max(Math.floor(height / unit), 1);
    const cellW = width / columns;
    const cellH = height / rows;
    const cell = (column: number, row: number) => ({
      cx: x + (column + 0.5) * cellW,
      cy: y + (row + 0.5) * cellH,
    });

    switch (pattern) {
      case "dots":
        for (let row = 0; row < rows; row++)
          for (let column = 0; column < columns; column++) {
            const { cx, cy } = cell(column, row);
            g.fillCircle(cx, cy, unit * 0.2);
          }
        break;
      case "lattice":
        // Diamonds edge to edge make a trellis: nothing like the red box's dots.
        for (let row = 0; row < rows; row++)
          for (let column = 0; column < columns; column++) {
            const { cx, cy } = cell(column, row);
            g.beginPath();
            g.moveTo(cx, cy - cellH / 2)
              .lineTo(cx + cellW / 2, cy)
              .lineTo(cx, cy + cellH / 2)
              .lineTo(cx - cellW / 2, cy)
              .closePath();
            g.strokePath();
          }
        break;
      case "plus":
        for (let row = 0; row < rows; row++)
          for (let column = 0; column < columns; column++) {
            const { cx, cy } = cell(column, row);
            const arm = unit * 0.24;
            g.lineBetween(cx - arm, cy, cx + arm, cy);
            g.lineBetween(cx, cy - arm, cx, cy + arm);
          }
        break;
      case "checks":
        for (let row = 0; row < rows; row++)
          for (let column = 0; column < columns; column++) {
            if ((row + column) % 2) continue;
            g.fillRect(x + column * cellW, y + row * cellH, cellW, cellH);
          }
        break;
      case "stripes":
        for (let column = 0; column < columns; column++) {
          const cx = x + (column + 0.5) * cellW;
          g.lineBetween(cx, y, cx, y + height);
        }
        break;
      case "planks":
        for (let row = 0; row <= rows; row++) {
          const cy = y + row * cellH;
          g.lineBetween(x, cy, x + width, cy);
        }
        break;
      case "zigzag":
      case "waves":
        for (let row = 0; row < rows; row++) {
          const cy = y + (row + 0.5) * cellH;
          const amplitude = cellH * 0.22;
          const steps = pattern === "zigzag" ? columns * 2 : columns * 8;
          g.beginPath();
          for (let step = 0; step <= steps; step++) {
            const px = x + (width * step) / steps;
            const py =
              pattern === "zigzag"
                ? cy + (step % 2 ? amplitude : -amplitude)
                : cy + Math.sin((step / steps) * columns * Math.PI * 2) * amplitude;
            if (step === 0) g.moveTo(px, py);
            else g.lineTo(px, py);
          }
          g.strokePath();
        }
        break;
    }
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
    const button = (found: RoundButton | null) =>
      found ? { x: found.x, y: found.y, visible: found.visible, enabled: found.alpha === 1 } : null;
    const selected = this.drag?.selected;
    const entries = round ? [...round.entries.values()] : [];
    return {
      ready: this.initialized,
      menuOpen: this.menuOpen,
      locale: this.locale,
      settings: { ...this.settings },
      level: round?.level.level ?? null,
      completed: this.isCompleted,
      trayPage: this.trayPage,
      selected: selected ? this.entryOf(selected).def.id : null,
      glow: this.glowColor,
      boxes: (round?.boxes ?? []).map((box, index) => {
        const place = this.boxPlaces[index];
        return {
          color: box.color.id,
          label: box.label.text,
          x: place.body.x + place.body.width / 2,
          y: place.body.y + place.body.height / 2,
          contents: [...box.contents],
        };
      }),
      tray: (round?.tray ?? []).map((id) => {
        const { image, home, def } = round!.entries.get(id)!;
        return { id, color: def.color, x: image.x, y: image.y, shown: home !== null };
      }),
      sorted: entries
        .filter((entry) => entry.box !== null)
        .map((entry) => {
          const target = this.slotPlacement(entry);
          return {
            id: entry.def.id,
            color: entry.def.color,
            box: round!.boxes[entry.box!].color.id,
            x: entry.image.x,
            y: entry.image.y,
            target: { x: target.x, y: target.y },
          };
        }),
      buttons: {
        hint: this.menu?.buttonView("game-hint") ?? null,
        previous: button(this.prevTrayBtn),
        next: button(this.nextTrayBtn),
        nextRound: button(this.nextBtn),
      },
    };
  }
}
