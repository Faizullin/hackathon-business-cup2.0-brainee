// biome-ignore-all lint/style/noNonNullAssertion: ported GSP source; lookups are guarded by the scene lifecycle
import assert from "node:assert/strict";
import { describe, test } from "vitest";
import { center, computeLayout, contains, type Rect } from "./game/layout.ts";
import { levelFor } from "./game/levels.ts";
import { Matching } from "./game/matching.ts";
import { advanceProgress, parseProgress, START } from "./game/progress.ts";
import { pickRound } from "./game/round.ts";
import { middleEdge, SHAPES, shapePath } from "./game/shapes.ts";
import { COPY, resolveLocale } from "./i18n.ts";

describe("Shape Pairs", () => {
  test("six levels have exactly one to six pairs", () => {
    assert.deepEqual(
      [1, 2, 3, 4, 5, 6].map((n) => levelFor(n).count),
      [1, 2, 3, 4, 5, 6],
    );
    assert.equal(levelFor(Infinity).level, 1);
    assert.equal(levelFor(-10).level, 1);
    assert.equal(levelFor(10).level, 6);
  });
  test("every level yields unique, deterministic shapes and shuffled twins", () => {
    for (let level = 1; level <= 6; level++)
      for (let seed = 0; seed < 100; seed++) {
        const spec = levelFor(level),
          [a, b] = pickRound(spec, seed);
        assert.equal(a.length, spec.count);
        assert.equal(new Set(a).size, spec.count);
        assert.deepEqual([...a].sort(), [...b].sort());
        if (spec.count > 1) assert.ok(a.every((id, i) => id !== b[i]));
        assert.deepEqual(pickRound(spec, seed), [a, b]);
        if (level <= 3)
          assert.equal(
            new Set(a.map((id) => SHAPES.find((s) => s.id === id)!.group)).size,
            a.length,
          );
      }
    assert.notDeepEqual(pickRound(levelFor(6), 1), pickRound(levelFor(6), 2));
  });
  test("all twelve geometric paths are finite, visible and contained", () => {
    assert.equal(SHAPES.length, 12);
    for (const shape of SHAPES) {
      const path = shapePath(shape.id);
      assert.ok(path.length >= 3);
      for (const p of path)
        assert.ok(
          Number.isFinite(p.x) &&
            Number.isFinite(p.y) &&
            Math.abs(p.x) <= 0.51 &&
            Math.abs(p.y) <= 0.51,
          shape.id,
        );
      const area = Math.abs(
        path.reduce((sum, p, i) => {
          const next = path[(i + 1) % path.length];
          return sum + p.x * next.y - next.x * p.y;
        }, 0) / 2,
      );
      assert.ok(area > 0.15, `${shape.id}: usable silhouette`);
      // A knot and a string tie on where the outline crosses the middle line.
      const top = middleEdge(shape.id, -1),
        bottom = middleEdge(shape.id, 1);
      assert.ok(
        top < 0 && top >= -0.51 && bottom > 0 && bottom <= 0.51,
        `${shape.id}: ${top}, ${bottom}`,
      );
    }
    assert.ok(
      Math.abs(middleEdge("star", 1) - 0.48 * 0.46) < 0.01,
      "the star's knot sits in its notch",
    );
    assert.ok(Math.abs(middleEdge("square", 1) - 0.43) < 0.001);
    assert.ok(middleEdge("heart", -1) > -0.3, "a string reaches the heart's dip, not above it");
  });
  test("every hit target fits, stays 64px or larger and avoids controls at all viewports", () => {
    const overlaps = (a: Rect, b: Rect) =>
      a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
    for (const [width, height] of [
      [1280, 720],
      [1024, 768],
      [768, 1024],
      [390, 844],
      [360, 640],
      [844, 390],
      [640, 360],
    ]) {
      for (const count of [1, 2, 3, 4, 5, 6]) {
        const layout = computeLayout(width, height, count);
        const targets = layout.slots.flat();
        // Sound and hint are 72 px across, Next 88 px; each box adds its outline.
        const box = (p: { x: number; y: number }, size: number) => ({
          x: p.x - size / 2,
          y: p.y - size / 2,
          width: size,
          height: size,
        });
        const buttons = [box(layout.sound, 78), box(layout.hint, 78), box(layout.next, 94)];
        const viewport = { x: 0, y: 0, width, height };
        for (const r of [...targets, ...buttons]) {
          assert.ok(r.width >= 64 && r.height >= 64, `${width}×${height}, ${count}`);
          assert.ok(
            contains(viewport, r) && contains(viewport, { x: r.x + r.width, y: r.y + r.height }),
          );
          assert.ok(!overlaps(r, { x: 0, y: 0, width: 48, height: 48 }));
        }
        const all = [...targets, ...buttons];
        for (let i = 0; i < all.length; i++)
          for (let j = i + 1; j < all.length; j++)
            assert.ok(!overlaps(all[i], all[j]), `${width}×${height}, ${count}: ${i}/${j}`);
        assert.deepEqual(center(layout.board), layout.next);
      }
    }
  });
  test("selection and matching work from both groups without repeat completions", () => {
    const m = new Matching(["circle", "star", "heart"]);
    m.tap({ id: "circle", side: 1 });
    m.tap({ id: "star", side: 1 });
    assert.deepEqual(m.selected, { id: "star", side: 1 });
    m.tap({ id: "star", side: 1 });
    assert.equal(m.selected, null);
    m.tap({ id: "circle", side: 1 });
    assert.deepEqual(m.tap({ id: "circle", side: 0 }), {
      kind: "matched",
      shape: "circle",
      attempts: 1,
    });
    assert.deepEqual(m.tap({ id: "circle", side: 0 }), { kind: "ignored" });
    assert.equal(m.matched.size, 1);
    assert.equal(m.wrongTries, 0);
    m.connect({ id: "star", side: 0 }, { id: "star", side: 1 });
    m.connect({ id: "heart", side: 1 }, { id: "heart", side: 0 });
    assert.ok(m.completed);
  });
  test("wrong attempts latch independent hints until each pair is matched", () => {
    const m = new Matching(["circle", "star", "heart"]);
    for (const id of ["circle", "star"] as const) {
      for (let i = 0; i < 3; i++) {
        const out = m.connect({ id, side: 0 }, { id: "heart", side: 1 });
        assert.equal(out.kind, "rejected");
        assert.equal(m.selected, null);
        assert.equal(m.hints.has(id), i >= 1);
      }
    }
    assert.equal(m.wrongTries, 6);
    assert.deepEqual(m.connect({ id: "circle", side: 1 }, { id: "circle", side: 0 }), {
      kind: "matched",
      shape: "circle",
      attempts: 4,
    });
    assert.equal(m.hints.has("circle"), false);
    assert.equal(m.hints.has("star"), true);
    assert.equal(m.connect({ id: "star", side: 0 }, { id: "heart", side: 0 }).kind, "ignored");
    assert.equal(m.wrongTries, 6);
  });
  test("progress validates all six levels and keeps the chosen level after completion", () => {
    for (const saved of [
      null,
      [],
      "bad",
      {},
      { level: Infinity, solvedAtLevel: -1 },
      { level: 3.1, solvedAtLevel: 9 },
    ])
      assert.deepEqual(parseProgress(saved), START);
    assert.deepEqual(parseProgress({ level: 3, solvedAtLevel: 1, child: "ignored" }), {
      level: 3,
      solvedAtLevel: 1,
    });
    for (let level = 1; level <= 6; level++) {
      const p = parseProgress({ level, solvedAtLevel: 0 });
      assert.equal(p.level, level);
      assert.deepEqual(advanceProgress(p), { level, solvedAtLevel: 1 });
      assert.deepEqual(advanceProgress(advanceProgress(p)), p);
    }
    assert.deepEqual(parseProgress({ level: 7, solvedAtLevel: 0 }), START);
  });
  test("English-only copy (D-34): one complete dictionary whatever the requested locale", () => {
    assert.deepEqual(Object.keys(COPY), ["en"]);
    for (const value of Object.values(COPY.en)) assert.ok(value);
    assert.equal(resolveLocale("kk", "ru", "de", ["ru-RU"]), "en");
  });
});
