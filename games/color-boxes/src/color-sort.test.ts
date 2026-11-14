import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { computeLayout, MAX_VISIBLE_SLOTS, type Rect } from "@brainee/engine-phaser/layout";
import { seededRandom } from "@brainee/engine-phaser/random";
import { describe, test } from "vitest";
import { COLOR_SORT_CONTRACT } from "./contract.ts";
import { boxAt, boxPlaces, slotCenter } from "./game/boxes.ts";
import {
  areClose,
  BACKGROUND_URL,
  CLOSE_PAIRS,
  COLORS,
  EASY_COLORS,
  itemUrl,
  SCENE_HEIGHT,
  SCENE_WIDTH,
} from "./game/colors.ts";
import { BOX_CAPACITY, LEVELS, levelFor } from "./game/levels.ts";
import { advanceProgress, parseProgress, ROUNDS_PER_LEVEL, START } from "./game/progress.ts";
import { clampTrayPage, pickRound, trayPageCount } from "./game/round.ts";
import { configuredLevel, parseSettings, settingsFromProgress } from "./game/settings.ts";
import { COPY, resolveLocale } from "./i18n.ts";

const packageDir = path.join(import.meta.dirname, "..");

/** The playroom's place on screen for a window, with a full tray. */
function boardFor(width: number, height: number): Rect {
  return computeLayout({
    width,
    height,
    pictureWidth: SCENE_WIDTH,
    pictureHeight: SCENE_HEIGHT,
    columns: 1,
    rows: 1,
    visibleSlots: MAX_VISIBLE_SLOTS,
    paged: true,
  }).board;
}

const WINDOWS = [
  [1280, 720],
  [1024, 768],
  [768, 1024],
  [844, 390],
  [390, 844],
  [360, 640],
];

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

const inside = (inner: Rect, outer: Rect) =>
  inner.x >= outer.x - 0.01 &&
  inner.y >= outer.y - 0.01 &&
  inner.x + inner.width <= outer.x + outer.width + 0.01 &&
  inner.y + inner.height <= outer.y + outer.height + 0.01;

describe("color boxes core", () => {
  test("all nine menu combinations have enough distinct pictures and fit the boxes", () => {
    for (const boxes of [2, 3, 4])
      for (const perBox of [2, 3, 4]) {
        const level = configuredLevel({ boxes, perBox });
        for (let seed = 0; seed < 200; seed++) {
          const round = pickRound(level, seededRandom(seed));
          assert.equal(round.colors.length, boxes);
          assert.equal(round.items.length, boxes * perBox);
          assert.equal(new Set(round.items.map((item) => item.id)).size, boxes * perBox);
          for (const color of round.colors) {
            const count = round.items.filter((item) => item.color === color.id).length;
            assert.equal(count, perBox);
            assert.ok(count + Number(round.examples.has(color.id)) <= BOX_CAPACITY);
          }
        }
      }
  });

  test("menu settings validate saved values and migrate old progress", () => {
    assert.deepEqual(parseSettings({ boxes: 9, perBox: 2.5 }), { boxes: 2, perBox: 2 });
    assert.deepEqual(parseSettings(null), { boxes: 2, perBox: 2 });
    assert.deepEqual(settingsFromProgress({ level: 5 }), { boxes: 4, perBox: 4 });
    assert.deepEqual(settingsFromProgress({ level: 5, settings: { boxes: 2, perBox: 3 } }), {
      boxes: 2,
      perBox: 3,
    });
  });

  test("English-only copy (D-34): one complete dictionary whatever the requested locale", () => {
    assert.deepEqual(Object.keys(COPY), ["en"]);
    for (const value of Object.values(COPY.en)) assert.ok(value);
    assert.equal(resolveLocale("kk", "ru", "de", ["ru-RU"]), "en");
  });

  test("contract name", () => {
    assert.equal(COLOR_SORT_CONTRACT, "color-boxes@1");
  });

  test("levels grow from two boxes of two to four boxes of four", () => {
    assert.deepEqual(
      LEVELS.map((level) => [level.boxes, level.perBox, level.example, level.hard]),
      [
        [2, 2, true, false],
        [3, 2, true, false],
        [3, 3, false, false],
        [4, 3, false, true],
        [4, 4, false, true],
      ],
    );
    assert.equal(levelFor(0).level, 1);
    assert.equal(levelFor(99).level, 5);
    assert.equal(BOX_CAPACITY, 4);
  });

  test("eight colours with distinct patterns, enough pictures each, and their art on disk", () => {
    assert.equal(COLORS.length, 8);
    assert.equal(new Set(COLORS.map((color) => color.pattern)).size, 8);
    assert.ok(fs.existsSync(path.join(packageDir, BACKGROUND_URL)));
    const ids = COLORS.flatMap((color) => color.items.map((item) => item.id));
    assert.equal(new Set(ids).size, ids.length, "picture ids are unique");
    for (const color of COLORS) {
      assert.ok(
        color.items.length >= BOX_CAPACITY + 1,
        `${color.id}: ${color.items.length} pictures`,
      );
      for (const item of color.items) {
        assert.equal(item.color, color.id);
        assert.ok(fs.existsSync(path.join(packageDir, itemUrl(item))), itemUrl(item));
      }
    }
    for (const [a, b] of CLOSE_PAIRS) {
      assert.ok(areClose(a, b) && areClose(b, a));
    }
  });

  test("a round has the level's boxes and pictures, and easy levels keep close colours apart", () => {
    for (const level of LEVELS) {
      for (let seed = 1; seed <= 200; seed++) {
        const round = pickRound(level, seededRandom(seed));
        assert.equal(round.colors.length, level.boxes);
        assert.equal(new Set(round.colors).size, level.boxes);
        assert.equal(round.items.length, level.boxes * level.perBox);
        assert.equal(new Set(round.items).size, round.items.length, "no picture twice");
        for (const color of round.colors) {
          assert.equal(round.items.filter((item) => item.color === color.id).length, level.perBox);
          const example = round.examples.get(color.id);
          assert.equal(Boolean(example), level.example);
          if (example) {
            assert.equal(example.color, color.id);
            assert.ok(!round.items.includes(example), "the example isn't in the tray too");
          }
        }
        if (!level.hard) {
          for (const color of round.colors)
            assert.ok(EASY_COLORS.includes(color.id), `${color.id} on level ${level.level}`);
          for (const a of round.colors) {
            for (const b of round.colors)
              assert.ok(
                a === b || !areClose(a.id, b.id),
                `${a.id} with ${b.id} on level ${level.level}`,
              );
          }
        }
      }
    }
  });

  test("hard levels use the extra colours and sometimes close ones", () => {
    const rounds = Array.from({ length: 200 }, (_, seed) =>
      pickRound(LEVELS[4], seededRandom(seed)),
    );
    const seen = new Set(rounds.flatMap((round) => round.colors.map((color) => color.id)));
    assert.equal(seen.size, 8);
    assert.ok(
      rounds.some((round) =>
        round.colors.some((a) => round.colors.some((b) => areClose(a.id, b.id))),
      ),
    );
  });

  test("the same seed gives the same round, another seed another one", () => {
    const ids = (seed: number) => {
      const round = pickRound(LEVELS[2], seededRandom(seed));
      return [
        ...round.colors.map((color) => color.id),
        ...round.items.map((item) => item.id),
      ].join();
    };
    assert.equal(ids(7), ids(7));
    assert.ok(Array.from({ length: 20 }, (_, seed) => ids(seed)).some((round) => round !== ids(7)));
  });

  test("boxes sit inside the scene, apart, and big enough for a finger at every size", () => {
    for (const [width, height] of WINDOWS) {
      const board = boardFor(width, height);
      for (const count of [2, 3, 4]) {
        const boxes = boxPlaces(board, count);
        const where = `${count} boxes at ${width}×${height}`;
        for (const [index, box] of boxes.entries()) {
          assert.ok(inside(box.zone, board), `${where}: box ${index} reaches outside`);
          assert.ok(
            box.body.width >= 64,
            `${where}: a box is ${box.body.width.toFixed(1)} px wide`,
          );
          assert.ok(
            box.zone.height >= 64,
            `${where}: a box's zone is ${box.zone.height.toFixed(1)} px tall`,
          );
          for (const other of boxes.slice(index + 1))
            assert.ok(!overlaps(box.zone, other.zone), `${where}: zones overlap`);
          for (let slot = 0; slot < BOX_CAPACITY; slot++) {
            const center = slotCenter(box, slot);
            assert.ok(
              center.x > box.zone.x && center.x < box.zone.x + box.zone.width,
              `${where}: slot ${slot}`,
            );
            assert.ok(
              center.y - box.itemSide / 2 >= box.zone.y - 0.01,
              `${where}: slot ${slot} pokes out of the zone`,
            );
          }
        }
      }
    }
  });

  test("a point finds the box it is on, and nothing between or above the boxes", () => {
    const board = boardFor(1280, 720);
    const boxes = boxPlaces(board, 4);
    for (const [index, box] of boxes.entries()) {
      assert.equal(
        boxAt({ x: box.body.x + box.body.width / 2, y: box.body.y + box.body.height / 2 }, boxes),
        index,
      );
      assert.equal(boxAt(slotCenter(box, 0), boxes), index);
    }
    const gap = (boxes[0].zone.x + boxes[0].zone.width + boxes[1].zone.x) / 2;
    assert.equal(boxAt({ x: gap, y: boxes[0].body.y + 4 }, boxes), null);
    assert.equal(boxAt({ x: board.x + board.width / 2, y: board.y + 10 }, boxes), null);
  });

  test("progress: malformed saves start over, levels open every few rounds", () => {
    assert.deepEqual(parseProgress(null), START);
    assert.deepEqual(parseProgress([1]), START);
    assert.deepEqual(parseProgress({ level: 9, solvedAtLevel: -1 }), START);
    assert.deepEqual(parseProgress({ level: 3, solvedAtLevel: 1 }), { level: 3, solvedAtLevel: 1 });

    let progress = { ...START };
    for (let solved = 0; solved < ROUNDS_PER_LEVEL; solved++) progress = advanceProgress(progress);
    assert.deepEqual(progress, { level: 2, solvedAtLevel: 0 });
    assert.deepEqual(advanceProgress({ level: LEVELS.length, solvedAtLevel: 1 }), {
      level: LEVELS.length,
      solvedAtLevel: 0,
    });
  });

  test("the tray pages six at a time", () => {
    assert.equal(trayPageCount(16, 6), 3);
    assert.equal(trayPageCount(4, 6), 1);
    assert.equal(clampTrayPage(2, 7, 6), 1);
    assert.equal(clampTrayPage(-1, 12, 6), 0);
  });
});
