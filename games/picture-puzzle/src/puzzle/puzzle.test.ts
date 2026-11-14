import assert from "node:assert/strict";
import { describe, test } from "vitest";
import { PICTURE_PUZZLE_CONTRACT } from "../contract.ts";
import { BLANK, edgeSize, FLAT, generateEdges, TAB } from "./edges.ts";
import {
  ARROW_BAND,
  cellCenter,
  computeLayout,
  MAX_VISIBLE_SLOTS,
  type Rect,
  TOP_BAR,
} from "./layout.ts";
import { LEVELS, levelFor, SMALL_SCREEN_SHORT_SIDE } from "./levels.ts";
import { PICTURE_HEIGHT, PICTURE_WIDTH, PICTURES } from "./pictures.ts";
import { clampTrayPage, pieceCell, pieceIndex, splitPieces, trayPageCount } from "./pieces.ts";
import { advanceProgress, PICTURES_PER_LEVEL, parseProgress, START } from "./progress.ts";
import { puzzleSeed, seededRandom } from "./random.ts";
import { type PathPen, tracePiece } from "./shape.ts";
import { dropResult, pulledPosition, shouldGlowHint } from "./snap.ts";

const inside = (inner: Rect, outer: Rect) =>
  inner.x >= outer.x - 0.01 &&
  inner.y >= outer.y - 0.01 &&
  inner.x + inner.width <= outer.x + outer.width + 0.01 &&
  inner.y + inner.height <= outer.y + outer.height + 0.01;

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

describe("picture puzzle core", () => {
  test("contract name", () => {
    assert.equal(PICTURE_PUZZLE_CONTRACT, "picture-puzzle@1");
  });

  test("levels grow from one missing piece to a 35-piece jigsaw", () => {
    assert.deepEqual(
      LEVELS.map((l) => [l.mode, l.rows * l.columns, l.inTray]),
      [
        ["finish", 4, 1],
        ["finish", 9, 2],
        ["jigsaw", 6, 6],
        ["jigsaw", 12, 12],
        ["jigsaw", 35, 35],
      ],
    );
    assert.equal(levelFor(0, 1000).level, 1);
    assert.equal(levelFor(9, 1000).level, 5);
    assert.equal(levelFor(5, 1000).inTray, 35);
    const capped = levelFor(5, SMALL_SCREEN_SHORT_SIDE - 1);
    assert.deepEqual([capped.level, capped.rows, capped.columns, capped.inTray], [5, 3, 4, 12]);
  });

  test("edges interlock: flat outside, opposite across every inner side", () => {
    const columns = 7;
    const rows = 5;
    const edges = generateEdges(columns, rows, seededRandom(1));
    for (let c = 0; c < columns; c++) {
      for (let r = 0; r < rows; r++) {
        const piece = edges[c][r];
        if (c === 0) assert.equal(piece.left, FLAT);
        if (r === 0) assert.equal(piece.top, FLAT);
        if (c === columns - 1) assert.equal(piece.right, FLAT);
        else assert.equal(piece.right + edges[c + 1][r].left, TAB + BLANK);
        if (r === rows - 1) assert.equal(piece.bottom, FLAT);
        else assert.equal(piece.bottom + edges[c][r + 1].top, TAB + BLANK);
      }
    }
  });

  test("the same picture and level always cut the same way", () => {
    const seed = puzzleSeed("dog", 4);
    assert.deepEqual(
      generateEdges(4, 3, seededRandom(seed)),
      generateEdges(4, 3, seededRandom(seed)),
    );
    assert.notEqual(seed, puzzleSeed("dog", 5));
    assert.deepEqual(edgeSize(PICTURE_WIDTH, PICTURE_HEIGHT, 4, 3), {
      edgeWidth: 36,
      edgeHeight: 36,
    });
  });

  test("a piece's shape closes and puts tabs out and blanks in", () => {
    const calls: string[] = [];
    const arcs: { r: number; ccw?: boolean }[] = [];
    const pen: PathPen = {
      beginPath: () => calls.push("begin"),
      moveTo: () => calls.push("move"),
      lineTo: () => calls.push("line"),
      arc: (_x, _y, r, _s, _e, ccw) => {
        calls.push("arc");
        arcs.push({ r, ccw });
      },
      closePath: () => calls.push("close"),
    };
    tracePiece(pen, 100, 100, 10, 10, { left: FLAT, top: FLAT, right: TAB, bottom: BLANK });
    assert.equal(calls[0], "begin");
    assert.equal(calls.at(-1), "close");
    assert.deepEqual(arcs, [
      { r: 11, ccw: false },
      { r: 9, ccw: true },
    ]);
  });

  test("pieces split into tray and board, numbered like the cutter", () => {
    const random = seededRandom(7);
    const finish = splitPieces(LEVELS[1], random);
    assert.equal(finish.inTray.length, 2);
    assert.equal(finish.onBoard.length, 7);
    assert.deepEqual(
      [...finish.inTray, ...finish.onBoard].sort((a, b) => a - b),
      [0, 1, 2, 3, 4, 5, 6, 7, 8],
    );
    const jigsaw = splitPieces(LEVELS[3], random);
    assert.equal(jigsaw.inTray.length, 12);
    assert.equal(jigsaw.onBoard.length, 0);
    assert.equal(pieceIndex(2, 1, 4), 6);
    assert.deepEqual(pieceCell(6, 4), { column: 2, row: 1 });
  });

  for (const [width, height] of [
    [1280, 720],
    [1440, 900],
    [390, 664],
    [768, 1024],
    [320, 480],
  ]) {
    test(`layout fits a ${width} × ${height} window`, () => {
      const screen = { x: 0, y: 0, width, height };
      for (const level of LEVELS) {
        const visible = Math.min(level.inTray, MAX_VISIBLE_SLOTS);
        const layout = computeLayout({
          width,
          height,
          pictureWidth: PICTURE_WIDTH,
          pictureHeight: PICTURE_HEIGHT,
          columns: level.columns,
          rows: level.rows,
          visibleSlots: visible,
        });
        assert.equal(layout.orientation, width >= height ? "landscape" : "portrait");
        assert.ok(inside(layout.board, screen), "board on screen");
        assert.ok(layout.board.y >= TOP_BAR, "board clear of the top buttons and back button");
        assert.ok(
          Math.abs(layout.board.width / layout.board.height - 4 / 3) < 0.001,
          "picture aspect kept",
        );
        assert.ok(!overlaps(layout.board, layout.tray), "tray beside or under the board");
        assert.equal(layout.slots.length, visible);
        for (const slot of layout.slots)
          assert.ok(inside(slot, layout.tray), "slot inside the tray");
        const center = cellCenter(layout, level.columns - 1, level.rows - 1);
        assert.ok(
          Math.abs(center.x - (layout.board.x + layout.board.width - layout.cellWidth / 2)) < 0.01,
        );
      }
    });
  }

  test("a paged tray keeps its arrows on screen, clear of the slots", () => {
    for (const [width, height] of [
      [1280, 720],
      [1024, 768],
      [390, 844],
      [768, 1024],
      [640, 360],
    ]) {
      const layout = computeLayout({
        width,
        height,
        pictureWidth: PICTURE_WIDTH,
        pictureHeight: PICTURE_HEIGHT,
        columns: 4,
        rows: 3,
        visibleSlots: MAX_VISIBLE_SLOTS,
        paged: true,
      });
      const { arrows } = layout;
      assert.ok(arrows, `${width}x${height}`);
      for (const arrow of [arrows.previous, arrows.next]) {
        const button = {
          x: arrow.x - ARROW_BAND / 2,
          y: arrow.y - ARROW_BAND / 2,
          width: ARROW_BAND,
          height: ARROW_BAND,
        };
        assert.ok(
          inside(button, { x: 0, y: 0, width, height }),
          `${width}x${height} arrow on screen`,
        );
        assert.ok(inside(button, layout.tray), `${width}x${height} arrow in tray`);
        for (const slot of layout.slots)
          assert.ok(!overlaps(button, slot), `${width}x${height} arrow clear of slots`);
      }
    }
    const unpaged = computeLayout({
      width: 1280,
      height: 720,
      pictureWidth: PICTURE_WIDTH,
      pictureHeight: PICTURE_HEIGHT,
      columns: 2,
      rows: 2,
      visibleSlots: 1,
    });
    assert.equal(unpaged.arrows, null);
  });

  test("tray pages stay on a page that still has pieces", () => {
    assert.equal(trayPageCount(0, 6), 1);
    assert.equal(trayPageCount(6, 6), 1);
    assert.equal(trayPageCount(7, 6), 2);
    assert.equal(clampTrayPage(1, 6, 6), 0);
    assert.equal(clampTrayPage(1, 7, 6), 1);
    assert.equal(clampTrayPage(-1, 12, 6), 0);
    assert.equal(clampTrayPage(5, 12, 6), 1);
  });

  test("snapping is forgiving and the pull eases into place", () => {
    const target = { x: 100, y: 100 };
    assert.equal(dropResult({ x: 130, y: 100 }, target, 100, 100), "snap");
    assert.equal(dropResult({ x: 140, y: 100 }, target, 100, 100), "return");
    assert.deepEqual(pulledPosition({ x: 200, y: 100 }, target, 100, 100), { x: 200, y: 100 });
    const pulled = pulledPosition({ x: 140, y: 100 }, target, 100, 100);
    assert.ok(pulled.x < 140 && pulled.x > 100);
    assert.equal(shouldGlowHint(1), false);
    assert.equal(shouldGlowHint(2), true);
  });

  test("progress: malformed saves start over, levels open every few pictures", () => {
    assert.deepEqual(parseProgress(null, PICTURES.length), START);
    assert.deepEqual(parseProgress({ level: 9, picture: -1 }, PICTURES.length), START);
    assert.deepEqual(parseProgress({ level: 3, picture: 4, solvedAtLevel: 1 }, PICTURES.length), {
      level: 3,
      picture: 4,
      solvedAtLevel: 1,
    });

    let progress = START;
    for (let i = 0; i < PICTURES_PER_LEVEL; i++)
      progress = advanceProgress(progress, PICTURES.length);
    assert.deepEqual(progress, { level: 2, picture: PICTURES_PER_LEVEL, solvedAtLevel: 0 });

    let top = { level: 5, picture: 4, solvedAtLevel: 1 };
    top = advanceProgress(top, PICTURES.length);
    assert.deepEqual(top, { level: 5, picture: 0, solvedAtLevel: 0 });
  });

  test("every picture names itself", () => {
    for (const picture of PICTURES) {
      assert.ok(picture.word, picture.id);
    }
  });
});
