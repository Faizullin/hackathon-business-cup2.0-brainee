import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { computeLayout, MAX_VISIBLE_SLOTS, type Rect } from "@brainee/engine-phaser/layout";
import { seededRandom } from "@brainee/engine-phaser/random";
import { describe, test } from "vitest";
import { STICKER_SCENE_CONTRACT } from "./contract.ts";
import { LEVELS, levelFor, SMALL_SCREEN_SHORT_SIDE } from "./game/levels.ts";
import { reachSide, stickerAt, stickerCenter, stickerSide } from "./game/placement.ts";
import { advanceProgress, parseProgress, SCENES_PER_LEVEL, START } from "./game/progress.ts";
import { clampTrayPage, pickRound, trayPageCount } from "./game/round.ts";
import { backgroundUrl, SCENE_HEIGHT, SCENE_WIDTH, SCENES, stickerUrl } from "./game/scenes.ts";
import { configuredLevel, missingFromProgress, parseMissing } from "./game/settings.ts";
import { COPY, resolveLocale } from "./i18n.ts";

const packageDir = path.join(import.meta.dirname, "..");

/** The scene's place on screen for a window, with a full tray. */
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

describe("sticker scene core", () => {
  test("all locations and levels honour every missing count from three to six", () => {
    for (const scene of SCENES)
      for (const base of LEVELS)
        for (const count of [3, 4, 5, 6]) {
          const level = configuredLevel(base.level, count);
          assert.equal(level.count, count);
          assert.equal(level.fadedSticker, base.fadedSticker);
          for (let seed = 0; seed < 50; seed++) {
            const round = pickRound(scene.stickers, level, seededRandom(seed));
            assert.equal(round.length, count);
            assert.equal(new Set(round.map((sticker) => sticker.id)).size, count);
            assert.equal(
              scene.stickers.filter((sticker) => !round.includes(sticker)).length,
              12 - count,
            );
          }
        }
  });

  test("missing settings validate input and migrate old larger rounds safely", () => {
    for (const value of [null, "6", 2, 7, Infinity, 4.5]) assert.equal(parseMissing(value), 3);
    assert.equal(parseMissing(5), 5);
    assert.equal(missingFromProgress({ level: 5 }), 6);
    assert.equal(missingFromProgress({ level: 2 }), 4);
    assert.equal(missingFromProgress({ level: 5, missing: 3 }), 3);
    assert.equal(missingFromProgress(null), 3);
  });

  test("English-only copy (D-34): one complete dictionary whatever the requested locale", () => {
    assert.deepEqual(Object.keys(COPY), ["en"]);
    for (const value of Object.values(COPY.en)) assert.ok(value);
    assert.equal(resolveLocale("kk", "ru", "de", ["ru-RU"]), "en");
  });

  test("contract name", () => {
    assert.equal(STICKER_SCENE_CONTRACT, "sticker-scene@1");
  });

  test("legacy level defaults remain available for old-save migration", () => {
    assert.deepEqual(
      LEVELS.map((level) => [level.count, level.mixGroups, level.fadedSticker]),
      [
        [3, false, true],
        [4, false, false],
        [6, false, false],
        [8, true, false],
        [12, true, false],
      ],
    );
    assert.equal(levelFor(0, 900).level, 1);
    assert.equal(levelFor(99, 900).count, 12);
    assert.equal(levelFor(5, SMALL_SCREEN_SHORT_SIDE - 1).count, 8);
  });

  test("every scene has twelve stickers with their art, and enough outline groups", () => {
    assert.deepEqual(
      SCENES.map((scene) => scene.id),
      ["sea", "jungle", "farm"],
    );
    const easiestWithoutMixing = Math.max(
      ...LEVELS.filter((level) => !level.mixGroups).map((level) => level.count),
    );
    for (const scene of SCENES) {
      assert.equal(scene.stickers.length, 12, scene.id);
      assert.equal(
        new Set(scene.stickers.map((sticker) => sticker.id)).size,
        12,
        `${scene.id}: unique ids`,
      );
      assert.ok(
        new Set(scene.stickers.map((sticker) => sticker.group)).size >= easiestWithoutMixing,
        `${scene.id}: one sticker per group must fill ${easiestWithoutMixing} silhouettes`,
      );
      assert.ok(fs.existsSync(path.join(packageDir, backgroundUrl(scene))), backgroundUrl(scene));
      for (const sticker of scene.stickers) {
        assert.ok(sticker.word.length > 0, `${scene.id}/${sticker.id}: word`);
        assert.ok(
          fs.existsSync(path.join(packageDir, stickerUrl(scene, sticker))),
          stickerUrl(scene, sticker),
        );
      }
    }
  });

  test("a round has the level's count, and easy levels never repeat an outline group", () => {
    for (const scene of SCENES) {
      for (const level of LEVELS) {
        for (let seed = 1; seed <= 50; seed++) {
          const round = pickRound(scene.stickers, level, seededRandom(seed));
          assert.equal(round.length, level.count);
          assert.equal(new Set(round).size, level.count, "no sticker twice");
          if (!level.mixGroups) {
            assert.equal(
              new Set(round.map((sticker) => sticker.group)).size,
              level.count,
              `${scene.id} level ${level.level}`,
            );
          }
        }
      }
    }
  });

  test("the same seed gives the same round, another seed another one", () => {
    const [scene] = SCENES;
    const ids = (seed: number) =>
      pickRound(scene.stickers, LEVELS[0], seededRandom(seed)).map((sticker) => sticker.id);
    assert.deepEqual(ids(7), ids(7));
    assert.ok(
      Array.from({ length: 20 }, (_, seed) => ids(seed).join()).some(
        (round) => round !== ids(7).join(),
      ),
    );
  });

  test("silhouettes stay inside the scene and off each other, and are not laid out as a table", () => {
    const windows = [
      [1280, 720],
      [1024, 768],
      [844, 390],
      [390, 844],
      [360, 640],
    ];
    for (const [width, height] of windows) {
      const board = boardFor(width, height);
      for (const scene of SCENES) {
        const centers = scene.stickers.map((sticker) => stickerCenter(board, sticker));
        for (const [index, sticker] of scene.stickers.entries()) {
          const where = `${scene.id}/${sticker.id} at ${width}×${height}`;
          const center = centers[index];
          const side = stickerSide(board, sticker);
          assert.ok(
            center.x - side / 2 >= board.x && center.x + side / 2 <= board.x + board.width,
            where,
          );
          assert.ok(
            center.y - side / 2 >= board.y && center.y + side / 2 <= board.y + board.height,
            where,
          );
          // A picture doesn't fill its square's corners, so neighbours may come a little closer.
          for (const [otherIndex, other] of scene.stickers.entries()) {
            if (otherIndex <= index) continue;
            const room = 0.85 * ((side + stickerSide(board, other)) / 2);
            const gap = Math.hypot(
              center.x - centers[otherIndex].x,
              center.y - centers[otherIndex].y,
            );
            assert.ok(gap >= room, `${where}: overlaps ${other.id}`);
          }
        }
      }
    }
    for (const scene of SCENES) {
      const distinct = (values: number[]) => new Set(values.map((value) => value.toFixed(2))).size;
      assert.ok(distinct(scene.stickers.map((sticker) => sticker.x)) > 6, `${scene.id}: columns`);
      assert.ok(distinct(scene.stickers.map((sticker) => sticker.y)) > 6, `${scene.id}: rows`);
      assert.ok(distinct(scene.stickers.map((sticker) => sticker.size)) > 3, `${scene.id}: sizes`);
    }
  });

  test("small stickers are as easy to place as big ones, down to a small phone", () => {
    for (const [width, height] of [
      [390, 844],
      [360, 640],
    ]) {
      const board = boardFor(width, height);
      for (const scene of SCENES) {
        for (const sticker of scene.stickers) {
          assert.ok(
            reachSide(board, sticker) >= 64,
            `${scene.id}/${sticker.id} at ${width}×${height}`,
          );
          assert.ok(reachSide(board, sticker) >= stickerSide(board, sticker));
          assert.ok(
            stickerSide(board, sticker) >= 40,
            `${scene.id}/${sticker.id} is too small to see`,
          );
        }
      }
    }
  });

  test("a point finds the silhouette it is on, and nothing on open scenery", () => {
    const board = boardFor(1280, 720);
    for (const scene of SCENES) {
      for (const sticker of scene.stickers) {
        assert.equal(stickerAt(stickerCenter(board, sticker), board, scene.stickers), sticker);
      }
    }
    const [scene] = SCENES;
    assert.equal(stickerAt({ x: board.x + board.width, y: board.y }, board, scene.stickers), null);
    const [first, second] = scene.stickers;
    assert.equal(stickerAt(stickerCenter(board, second), board, [first]), null);
  });

  test("progress: malformed saves start over, levels open every few scenes", () => {
    assert.deepEqual(parseProgress(null, 3), START);
    assert.deepEqual(parseProgress("x", 3), START);
    assert.deepEqual(parseProgress({ level: 9, scene: -1, solvedAtLevel: 1.5 }, 3), START);
    assert.deepEqual(parseProgress({ level: 3, scene: 2, solvedAtLevel: 1 }, 3), {
      level: 3,
      scene: 2,
      solvedAtLevel: 1,
    });

    let progress = { ...START };
    for (let solved = 0; solved < SCENES_PER_LEVEL; solved++)
      progress = advanceProgress(progress, 3);
    assert.deepEqual(progress, { level: 2, scene: SCENES_PER_LEVEL % 3, solvedAtLevel: 0 });

    let last = { level: LEVELS.length, scene: 2, solvedAtLevel: 1 };
    last = advanceProgress(last, 3);
    assert.deepEqual(last, { level: LEVELS.length, scene: 0, solvedAtLevel: 0 });
  });

  test("the tray pages six at a time", () => {
    assert.equal(trayPageCount(12, 6), 2);
    assert.equal(trayPageCount(6, 6), 1);
    assert.equal(trayPageCount(0, 6), 1);
    assert.equal(clampTrayPage(1, 6, 6), 0);
    assert.equal(clampTrayPage(-1, 12, 6), 0);
    assert.equal(clampTrayPage(1, 7, 6), 1);
  });
});
