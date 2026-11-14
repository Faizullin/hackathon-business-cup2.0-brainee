import { BridgedScene } from "@brainee/engine-phaser";
import type { GameObjects, Input } from "phaser";
import { type PicturePuzzleContract, ROUNDS_PER_SESSION } from "../contract";
import { cutPicture } from "../puzzle/cut";
import { type EdgeLayout, edgeSize, generateEdges } from "../puzzle/edges";
import { cellCenter, computeLayout, MAX_VISIBLE_SLOTS, type PuzzleLayout } from "../puzzle/layout";
import { levelFor, type PuzzleLevel } from "../puzzle/levels";
import {
  PICTURE_HEIGHT,
  PICTURE_WIDTH,
  PICTURES,
  type PuzzlePicture,
  pictureKey,
  pictureUrl,
} from "../puzzle/pictures";
import {
  clampTrayPage,
  type PieceSplit,
  pieceCell,
  splitPieces,
  trayPageCount,
} from "../puzzle/pieces";
import { type PuzzleProgress, parseProgress } from "../puzzle/progress";
import { puzzleSeed, seededRandom } from "../puzzle/random";
import { tracePiece } from "../puzzle/shape";
import { dropResult, pulledPosition, shouldGlowHint } from "../puzzle/snap";
import { playReturnSound, playSnapSound, playVictorySound } from "../puzzle/sounds";
import { RoundButton } from "../ui/RoundButton";

/** Opened without a host: `?level=&picture=` (1-based level, 0-based picture). */
function progressFromUrl(): Partial<PuzzleProgress> {
  const params = new URLSearchParams(window.location.search);
  return {
    level: Number(params.get("level") ?? 1),
    picture: Number(
      params.get("picture") ?? Math.abs(Number(params.get("seed") ?? 0)) % PICTURES.length,
    ),
  };
}

interface Round {
  level: PuzzleLevel;
  picture: PuzzlePicture;
  edges: EdgeLayout;
  edgeWidth: number;
  edgeHeight: number;
  pieces: GameObjects.Image[];
  /** One flat silhouette under each tray piece; removed when the piece lands. */
  shadows: Map<number, GameObjects.Image>;
  split: PieceSplit;
}

const SPARK = "puzzle:spark";
const CONFETTI_COLORS = [0xf97316, 0x22c55e, 0x3b82f6, 0xeab308, 0xec4899, 0x8b5cf6];
/** Pixels a press must move before it becomes a drag; less is a tap. */
const DRAG_THRESHOLD = 8;

/**
 * The picture puzzle: drag (or tap, then tap the cell) each tray piece onto
 * its outline. Snaps are forgiving, wrong drops glide back, and a completed
 * picture fades in whole, is named aloud and saves progress.
 */
export class PuzzleScene extends BridgedScene<PicturePuzzleContract> {
  private sessionRounds = 0;
  private sessionMistakes = 0;
  private sessionCorrections = 0;
  private sessionStarted = performance.now();
  private sessionFinished = false;
  private round: Round | null = null;
  private progress: PuzzleProgress = { level: 1, picture: 0, solvedAtLevel: 0 };
  private currentLayout: PuzzleLayout | null = null;
  private reducedMotion = false;

  private card!: GameObjects.Graphics;
  private faded!: GameObjects.Image;
  private outlines!: GameObjects.Graphics;
  private hintGlow!: GameObjects.Graphics;
  private thumbnail!: GameObjects.Container;

  private trayPage = 0;
  private placedCount = 0;
  private attemptsPerPiece = new Map<number, number>();
  /** The piece whose cell glows after repeated wrong drops, until it lands. */
  private glowPieceIndex: number | null = null;
  private selectedPieceIndex: number | null = null;
  private draggingPieceIndex: number | null = null;
  private startTime = Date.now();
  private hintsUsed = 0;
  private isCompleted = false;
  private isSoundEnabled = true;

  private soundBtn!: RoundButton;
  private hintBtn!: RoundButton;
  private prevTrayBtn!: RoundButton;
  private nextTrayBtn!: RoundButton;
  private nextLevelBtn: RoundButton | null = null;

  constructor() {
    super("PuzzleScene");
  }

  preload() {
    for (const picture of PICTURES) this.load.image(pictureKey(picture), pictureUrl(picture));
  }

  async create() {
    this.reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    this.input.dragDistanceThreshold = DRAG_THRESHOLD;
    this.makeSparkTexture();

    this.card = this.add.graphics();
    this.faded = this.add.image(0, 0, pictureKey(PICTURES[0])).setOrigin(0).setVisible(false);
    this.outlines = this.add.graphics();
    this.hintGlow = this.add.graphics().setDepth(15);
    this.thumbnail = this.add.container(0, 0).setDepth(40).setVisible(false);
    this.createControls();

    this.scale.on("resize", () => this.layout());
    // A tap on the board places the selected piece; taps on pieces and buttons are theirs.
    this.input.on("pointerdown", (pointer: Input.Pointer, over: GameObjects.GameObject[]) => {
      if (over.length === 0) this.handleBoardTap(pointer);
    });

    await this.bridge.ready;
    const config = this.bridge.config;
    this.progress = parseProgress(
      config
        ? { level: config.level, picture: Math.abs(config.seed) % PICTURES.length }
        : progressFromUrl(),
      PICTURES.length,
    );
    this.startRound(this.progress);
    this.bridge.lifecycle("ready");
  }

  update() {
    // Shadows follow their pieces: close at rest, further while lifted.
    if (!this.round) return;
    for (const [index, shadow] of this.round.shadows) {
      const piece = this.round.pieces[index];
      const lifted = index === this.draggingPieceIndex;
      const offset = lifted ? 12 : 5;
      shadow
        .setPosition(piece.x + offset * 0.6, piece.y + offset)
        .setScale(piece.scale)
        .setAngle(piece.angle)
        .setVisible(piece.visible)
        .setDepth(piece.depth - 1)
        .setAlpha(lifted ? 0.28 : 0.2);
    }
  }

  private makeSparkTexture() {
    if (this.textures.exists(SPARK)) return;
    const dot = this.make.graphics({}, false);
    dot.fillStyle(0xffffff, 1).fillCircle(6, 6, 6);
    dot.generateTexture(SPARK, 12, 12);
    dot.destroy();
  }

  private createControls() {
    // Top-right: the store's back button floats in the top-left corner.
    const small = { radius: 20, bgColor: 0xffffff, strokeColor: 0xcbd5e1 };
    this.soundBtn = new RoundButton(this, 0, 0, {
      ...small,
      label: "🔊",
      fontSize: 16,
      onClick: () => {
        this.isSoundEnabled = !this.isSoundEnabled;
        this.soundBtn.setLabel(this.isSoundEnabled ? "🔊" : "🔇");
      },
    }).setDepth(50);
    this.hintBtn = new RoundButton(this, 0, 0, {
      ...small,
      label: "?",
      fontSize: 18,
      onClick: () => this.toggleThumbnail(),
    }).setDepth(50);

    const arrow = { radius: 18, fontSize: 12 };
    this.prevTrayBtn = new RoundButton(this, 0, 0, {
      ...arrow,
      onClick: () => this.turnTrayPage(-1),
    }).setDepth(50);
    this.nextTrayBtn = new RoundButton(this, 0, 0, {
      ...arrow,
      onClick: () => this.turnTrayPage(1),
    }).setDepth(50);
  }

  private startRound(progress: PuzzleProgress) {
    this.isCompleted = false;
    this.startTime = Date.now();
    this.placedCount = 0;
    this.attemptsPerPiece.clear();
    this.selectedPieceIndex = null;
    this.draggingPieceIndex = null;
    this.glowPieceIndex = null;
    this.hintGlow.clear();
    this.tweens.killTweensOf(this.hintGlow);
    this.trayPage = 0;
    this.hintsUsed = 0;
    this.nextLevelBtn?.destroy();
    this.nextLevelBtn = null;

    if (this.round) {
      for (const piece of this.round.pieces) piece.destroy();
      for (const shadow of this.round.shadows.values()) shadow.destroy();
    }

    const { width, height } = this.scale.gameSize;
    const level = levelFor(progress.level, Math.min(width, height));
    const picture = PICTURES[progress.picture];
    const random = seededRandom(puzzleSeed(picture.id, level.level));
    const edges = generateEdges(level.columns, level.rows, random);
    const { edgeWidth, edgeHeight } = edgeSize(
      PICTURE_WIDTH,
      PICTURE_HEIGHT,
      level.columns,
      level.rows,
    );
    const pieces = cutPicture(this, pictureKey(picture), {
      columns: level.columns,
      rows: level.rows,
      edges,
      edgeWidth,
      edgeHeight,
    });
    const split = splitPieces(level, random);

    const shadows = new Map<number, GameObjects.Image>();
    for (const index of split.inTray) {
      const piece = pieces[index];
      shadows.set(
        index,
        this.add.image(0, 0, piece.texture.key, piece.frame.name).setTint(0x1e293b).setAlpha(0.2),
      );
    }

    this.round = { level, picture, edges, edgeWidth, edgeHeight, pieces, shadows, split };

    this.faded
      .setTexture(pictureKey(picture))
      .setVisible(level.fadedPicture)
      .setAlpha(0.22)
      .setDepth(2);
    this.buildThumbnail(picture);
    this.setupPieceInteractions();
    this.layout();

    this.bridge.track("puzzle_started", {
      level: level.level,
      picture: picture.id,
      pieces: pieces.length,
    });
    this.bridge.state.set("level", level.level);
    this.bridge.state.set("total", split.inTray.length);
    this.bridge.state.set("placed", 0);
  }

  /** "?" shows the finished picture, framed, in the board's corner. */
  private buildThumbnail(picture: PuzzlePicture) {
    this.thumbnail.removeAll(true);
    const frame = this.add.graphics();
    const image = this.add.image(0, 0, pictureKey(picture)).setOrigin(0);
    this.thumbnail.add([frame, image]).setVisible(false);
  }

  private toggleThumbnail() {
    if (!this.round || this.isCompleted) return;
    const show = !this.thumbnail.visible;
    this.thumbnail.setVisible(show);
    if (show) {
      this.hintsUsed++;
      this.bridge.track("hint_used", {});
    }
  }

  private setupPieceInteractions() {
    if (!this.round) return;
    const { pieces, split } = this.round;

    for (const index of split.inTray) {
      const piece = pieces[index];
      piece.setInteractive({ useHandCursor: true });
      this.input.setDraggable(piece);

      piece.on("pointerdown", () => piece.setData("dragged", false));

      piece.on("dragstart", () => {
        if (this.isCompleted) return;
        piece.setData("dragged", true);
        this.selectPiece(null);
        this.draggingPieceIndex = index;
        this.children.bringToTop(piece);
        piece.setDepth(100);
        this.tweens.add({
          targets: piece,
          scale: (this.currentLayout?.scale ?? 1) * 1.06,
          angle: this.reducedMotion ? 0 : Math.random() * 4 - 2,
          duration: 120,
          ease: "Quad.easeOut",
        });
      });

      piece.on("drag", (_pointer: Input.Pointer, dragX: number, dragY: number) => {
        if (this.isCompleted || !this.currentLayout) return;
        const target = this.cellTarget(index);
        const eased = pulledPosition(
          { x: dragX, y: dragY },
          target,
          this.currentLayout.cellWidth,
          this.currentLayout.cellHeight,
        );
        piece.setPosition(eased.x, eased.y);
      });

      piece.on("dragend", () => {
        this.draggingPieceIndex = null;
        if (this.isCompleted || !this.currentLayout) return;
        const target = this.cellTarget(index);
        const result = dropResult(
          piece,
          target,
          this.currentLayout.cellWidth,
          this.currentLayout.cellHeight,
        );
        if (result === "snap") this.snapPieceInPlace(index);
        else this.returnPieceToTray(index);
      });

      // A press that doesn't move past the drag threshold is a tap: select the piece.
      piece.on("pointerup", () => {
        if (this.isCompleted || piece.getData("dragged")) return;
        this.selectPiece(this.selectedPieceIndex === index ? null : index);
      });
    }
  }

  private selectPiece(index: number | null) {
    if (!this.round) return;
    if (this.selectedPieceIndex !== null) this.round.pieces[this.selectedPieceIndex]?.clearTint();
    this.selectedPieceIndex = index;
    if (index !== null) this.round.pieces[index].setTint(0xfff1b8);
  }

  private cellTarget(index: number) {
    if (!this.round || !this.currentLayout) throw new Error("Puzzle layout is not ready");
    const { column, row } = pieceCell(index, this.round.level.columns);
    return cellCenter(this.currentLayout, column, row);
  }

  private snapPieceInPlace(index: number) {
    if (
      !this.round ||
      !this.currentLayout ||
      this.sessionFinished ||
      !this.round.split.inTray.includes(index)
    )
      return;
    const { split, pieces, shadows } = this.round;
    const piece = pieces[index];
    const target = this.cellTarget(index);
    const attempts = this.attemptsPerPiece.get(index) ?? 0;

    this.selectPiece(null);
    if (this.glowPieceIndex === index) this.setCellGlow(null);
    piece.disableInteractive();
    shadows.get(index)?.destroy();
    shadows.delete(index);
    this.tweens.add({
      targets: piece,
      x: target.x,
      y: target.y,
      scale: this.currentLayout.scale,
      angle: 0,
      duration: this.reducedMotion ? 0 : 160,
      ease: "Back.easeOut",
      // The layout may have changed mid-flight (a resize): land on the cell as it is now.
      onComplete: () => {
        const cell = this.cellTarget(index);
        piece
          .setPosition(cell.x, cell.y)
          .setScale(this.currentLayout?.scale ?? piece.scale)
          .setDepth(10);
      },
    });
    if (this.isSoundEnabled) playSnapSound();
    if (!this.reducedMotion) this.sparkle(target.x, target.y);

    split.inTray.splice(split.inTray.indexOf(index), 1);
    split.onBoard.push(index);
    this.placedCount++;
    this.bridge.track("piece_placed", { piece: index, attempts: attempts + 1 });
    this.bridge.state.set("placed", this.placedCount);
    this.sessionRounds++;
    if (attempts > 0) this.sessionCorrections++;
    this.bridge.track("round", { correct: true, afterMistake: attempts > 0 });
    if (this.sessionRounds === ROUNDS_PER_SESSION) {
      this.sessionFinished = true;
      this.isCompleted = true;
      this.input.enabled = false;
      this.bridge.track("finish", {
        gameId: "picture-puzzle",
        level: this.progress.level,
        rounds: ROUNDS_PER_SESSION,
        mistakes: this.sessionMistakes,
        corrections: this.sessionCorrections,
        durationMs: Math.round(performance.now() - this.sessionStarted),
      });
      return;
    }

    this.trayPage = clampTrayPage(this.trayPage, split.inTray.length, MAX_VISIBLE_SLOTS);
    if (split.inTray.length === 0) this.onVictory();
    else this.layout();
  }

  private returnPieceToTray(index: number) {
    if (!this.round || this.sessionFinished) return;
    const piece = this.round.pieces[index];
    const attempts = (this.attemptsPerPiece.get(index) ?? 0) + 1;
    this.attemptsPerPiece.set(index, attempts);
    if (shouldGlowHint(attempts)) this.setCellGlow(index);

    if (this.isSoundEnabled) playReturnSound();
    this.sessionMistakes++;
    this.bridge.track("piece_rejected", { piece: index });
    this.bridge.track("round", { correct: false, afterMistake: false });
    this.selectPiece(null);

    this.tweens.add({
      targets: piece,
      x: piece.getData("slotX") ?? piece.x,
      y: piece.getData("slotY") ?? piece.y,
      scale: piece.getData("slotScale") ?? piece.scale,
      angle: 0,
      duration: this.reducedMotion ? 0 : 250,
      ease: "Quad.easeOut",
      onComplete: () => piece.setDepth(20),
    });
  }

  private handleBoardTap(pointer: Input.Pointer) {
    if (!this.round || !this.currentLayout || this.selectedPieceIndex === null || this.isCompleted)
      return;
    const { board, cellWidth, cellHeight } = this.currentLayout;
    const inside =
      pointer.x >= board.x &&
      pointer.x <= board.x + board.width &&
      pointer.y >= board.y &&
      pointer.y <= board.y + board.height;
    if (!inside) return;

    const index = this.selectedPieceIndex;
    const { column, row } = pieceCell(index, this.round.level.columns);
    const tappedColumn = Math.floor((pointer.x - board.x) / cellWidth);
    const tappedRow = Math.floor((pointer.y - board.y) / cellHeight);
    if (tappedColumn === column && tappedRow === row) this.snapPieceInPlace(index);
    else this.returnPieceToTray(index);
  }

  /** A pulsing ring around a piece's cell; `null` turns it off. */
  private setCellGlow(index: number | null) {
    this.glowPieceIndex = index;
    this.tweens.killTweensOf(this.hintGlow);
    this.drawCellGlow();
    if (index === null || this.reducedMotion) return;
    this.tweens.add({
      targets: this.hintGlow,
      alpha: { from: 1, to: 0.35 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    });
  }

  private drawCellGlow() {
    this.hintGlow.clear().setAlpha(1);
    const index = this.glowPieceIndex;
    if (index === null || !this.currentLayout || !this.round) return;
    const { board, cellWidth, cellHeight } = this.currentLayout;
    const { column, row } = pieceCell(index, this.round.level.columns);
    this.hintGlow
      .lineStyle(4, 0xf59e0b, 1)
      .strokeRoundedRect(
        board.x + column * cellWidth - 2,
        board.y + row * cellHeight - 2,
        cellWidth + 4,
        cellHeight + 4,
        12,
      );
  }

  private sparkle(x: number, y: number) {
    const emitter = this.add.particles(x, y, SPARK, {
      speed: { min: 60, max: 180 },
      lifespan: 450,
      scale: { start: 0.7, end: 0 },
      tint: [0xfde68a, 0xffffff, 0xfbbf24],
      emitting: false,
    });
    emitter.setDepth(60).explode(14);
    this.time.delayedCall(600, () => emitter.destroy());
  }

  private confetti() {
    const board = this.currentLayout?.board;
    if (!board) return;
    const emitter = this.add.particles(0, 0, SPARK, {
      x: { min: board.x, max: board.x + board.width },
      y: board.y - 10,
      speedY: { min: 80, max: 220 },
      speedX: { min: -60, max: 60 },
      gravityY: 260,
      lifespan: 1800,
      rotate: { min: 0, max: 360 },
      scale: { start: 0.9, end: 0.4 },
      tint: CONFETTI_COLORS,
      emitting: false,
    });
    emitter.setDepth(70).explode(90);
    this.time.delayedCall(2200, () => emitter.destroy());
  }

  private onVictory() {
    if (!this.round || this.isCompleted) return;
    this.isCompleted = true;
    this.thumbnail.setVisible(false);

    // The whole picture fades in over the pieces and hides their seams.
    this.faded.setVisible(true).setAlpha(0).setDepth(35);
    this.tweens.add({ targets: this.faded, alpha: 1, duration: 300, ease: "Quad.easeOut" });
    if (this.isSoundEnabled) playVictorySound();
    if (!this.reducedMotion) this.confetti();
    this.bridge.track("puzzle_completed", {
      durationMs: Date.now() - this.startTime,
      hintsUsed: this.hintsUsed,
    });
    this.progress = { ...this.progress, picture: (this.progress.picture + 1) % PICTURES.length };

    this.nextLevelBtn = new RoundButton(this, 0, 0, {
      radius: 32,
      label: "➔",
      fontSize: 24,
      bgColor: 0x22c55e,
      textColor: "#ffffff",
      strokeColor: 0x16a34a,
      strokeWidth: 3,
      onClick: () => this.startRound(this.progress),
    }).setDepth(60);
    if (!this.reducedMotion) {
      this.tweens.add({
        targets: this.nextLevelBtn,
        scale: { from: 0.6, to: 1 },
        duration: 300,
        ease: "Back.easeOut",
      });
    }
    this.layout();
  }

  private turnTrayPage(step: number) {
    if (!this.round) return;
    this.trayPage = clampTrayPage(
      this.trayPage + step,
      this.round.split.inTray.length,
      MAX_VISIBLE_SLOTS,
    );
    this.layout();
  }

  private layout() {
    const round = this.round;
    if (!round) return;
    const { width, height } = this.scale.gameSize;
    const { level, split, pieces } = round;
    const layout = computeLayout({
      width,
      height,
      pictureWidth: PICTURE_WIDTH,
      pictureHeight: PICTURE_HEIGHT,
      columns: level.columns,
      rows: level.rows,
      // The tray keeps its space after the last piece so the board doesn't jump.
      visibleSlots: Math.min(Math.max(split.inTray.length, 1), MAX_VISIBLE_SLOTS),
      paged: split.inTray.length > MAX_VISIBLE_SLOTS,
    });
    this.currentLayout = layout;

    this.drawBoard(layout, round);
    this.drawCellGlow();
    this.placeThumbnail(layout);
    for (const index of split.onBoard) {
      const { column, row } = pieceCell(index, level.columns);
      const center = cellCenter(layout, column, row);
      pieces[index]
        .setPosition(center.x, center.y)
        .setScale(layout.scale)
        .setAngle(0)
        .setVisible(true)
        .setDepth(10);
    }
    this.placeTrayPieces(layout, round);

    this.soundBtn.setPosition(width - 40, 36);
    this.hintBtn.setPosition(width - 90, 36);
    this.placePagingButtons(layout, split.inTray.length);
    if (this.nextLevelBtn) {
      const { tray } = layout;
      this.nextLevelBtn.setPosition(tray.x + tray.width / 2, tray.y + tray.height / 2);
    }
  }

  private placeTrayPieces(layout: PuzzleLayout, round: Round) {
    const { split, pieces } = round;
    const first = this.trayPage * MAX_VISIBLE_SLOTS;
    split.inTray.forEach((index, position) => {
      const piece = pieces[index];
      const slot = layout.slots[position - first];
      if (position < first || !slot) {
        piece.setVisible(false);
        return;
      }
      const fit = slot.width / Math.max(piece.frame.width, piece.frame.height);
      const x = slot.x + slot.width / 2;
      const y = slot.y + slot.height / 2;
      piece.setData({ slotX: x, slotY: y, slotScale: fit });
      if (index === this.draggingPieceIndex) return;
      piece.setPosition(x, y).setScale(fit).setAngle(0).setVisible(true).setDepth(20);
    });
  }

  private placePagingButtons(layout: PuzzleLayout, trayPieces: number) {
    const pages = trayPageCount(trayPieces, MAX_VISIBLE_SLOTS);
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

  private placeThumbnail(layout: PuzzleLayout) {
    const { board } = layout;
    const width = Math.max(board.width * 0.28, 96);
    const height = (width * PICTURE_HEIGHT) / PICTURE_WIDTH;
    const [frame, image] = this.thumbnail.list as [GameObjects.Graphics, GameObjects.Image];
    if (!frame || !image) return;
    frame
      .clear()
      .fillStyle(0xffffff, 1)
      .fillRoundedRect(-6, -6, width + 12, height + 12, 10);
    frame.lineStyle(2, 0xcbd5e1, 1).strokeRoundedRect(-6, -6, width + 12, height + 12, 10);
    image.setScale(width / PICTURE_WIDTH);
    this.thumbnail.setPosition(board.x + board.width - width - 12, board.y + 12);
  }

  /** The raised card, the tray strip, the faded picture and every cell's outline. */
  private drawBoard(layout: PuzzleLayout, round: Round) {
    const { board, scale, cellWidth, cellHeight, tray } = layout;
    const { level, edges, edgeWidth, edgeHeight } = round;

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

    this.faded.setPosition(board.x, board.y).setScale(scale);

    const tabX = edgeWidth * scale;
    const tabY = edgeHeight * scale;
    this.outlines.clear().lineStyle(2, 0x94a3b8, 0.75);
    for (let row = 0; row < level.rows; row++) {
      for (let column = 0; column < level.columns; column++) {
        tracePiece(
          this.outlines,
          cellWidth + 2 * tabX,
          cellHeight + 2 * tabY,
          tabX,
          tabY,
          edges[column][row],
          board.x + column * cellWidth - tabX,
          board.y + row * cellHeight - tabY,
        );
        this.outlines.strokePath();
      }
    }
  }
}
