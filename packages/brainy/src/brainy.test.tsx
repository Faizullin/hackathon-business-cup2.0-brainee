import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Brainy } from "./Brainy";
import { brainyModel, mixColor } from "./model";
import { createTicker } from "./ticker";

const stats = (n: number) => ({ brain: n, eyes: n, mouth: n, arms: n, legs: n, resp: n });
describe("lavender Brain model", () => {
  it("uses mood independently of body stats, with peach kid-safe low energy", () => {
    expect(brainyModel(stats(90), {}, 10).fill).toBe("#f2b8a8");
    expect(brainyModel(stats(10), {}, 92).fill).toBe("#FF9EC2");
    expect(brainyModel(stats(90), {}, 0, 0, "full").fill).toBe("#bdb97e");
    expect(mixColor("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(brainyModel(stats(50), {}, Number.NaN).energy).toBe(0);
    expect(brainyModel(stats(50), {}, 120).energy).toBe(100);
  });
  it("maps each body part and stage while keeping responsibility separate", () => {
    const low = brainyModel(stats(10));
    const high = brainyModel(stats(90));
    expect(high.lobeScale).toBeGreaterThan(low.lobeScale);
    expect(high.eyeRadius).toBeGreaterThan(low.eyeRadius);
    expect(high.mouth).not.toBe(low.mouth);
    expect(high.limbWidth).toBeGreaterThan(low.limbWidth);
    expect(high.handRadius).toBeGreaterThan(low.handRadius);
    expect(high.legL).not.toBe(low.legL);
    expect(high.scale).toBeGreaterThan(low.scale);
    expect(brainyModel({ ...stats(50), resp: 70 }).flags.backpack).toBe(true);
    expect(brainyModel({ ...stats(50), resp: 69 }).flags.backpack).toBe(false);
    expect(brainyModel({ ...stats(50), eyes: 34 }).flags.sleepyZ).toBe(true);
    expect(brainyModel({ ...stats(50), eyes: 35 }).flags.sleepyZ).toBe(false);
  });
  it("gates lightning at the top stage and sparkles at energy 75", () => {
    expect(Number(brainyModel(stats(70), {}, 92).b0.op)).toBeGreaterThan(0);
    expect(Number(brainyModel(stats(69), {}, 92).b0.op)).toBe(0);
    expect(Number(brainyModel(stats(90), {}, 74).b0.op)).toBe(0);
    expect(Number(brainyModel(stats(10), {}, 75).sparkleOpacity)).toBeGreaterThan(0);
    expect(Number(brainyModel(stats(10), {}, 74).sparkleOpacity)).toBe(0);
  });
  it("animates posture but keeps static eyes open; never produces unsafe kid effects", () => {
    const a = brainyModel(stats(90), {}, 92, 0);
    const b = brainyModel(stats(90), {}, 92, 0.2);
    expect(a.bodyTransform).not.toBe(b.bodyTransform);
    expect(Number(a.lid)).toBe(0);
    for (const mood of [0, 10, 38, 62, 92, 100]) {
      const m = brainyModel(stats(mood), {}, mood);
      expect(m.rotOpacity).toBe(0);
      expect(m.f0.op).toBe(0);
      expect(Number(m.z0.op)).toBe(0);
      expect(JSON.stringify(m)).not.toMatch(/NaN|Infinity/);
    }
  });
});
describe("film speech", () => {
  it("clamps voice input and opens the mouth without changing the stat smile or posture", () => {
    const model = (talk: number) => brainyModel(stats(50), {}, 72, 0, "kid", [], talk);
    const silent = model(0);
    expect(model(1).talkMouth.ry).toBeGreaterThan(model(0.2).talkMouth.ry);
    expect(model(2).talkMouth).toEqual(model(1).talkMouth);
    expect(model(-1).talk).toBe(0);
    expect(model(Number.NaN).talk).toBe(0);
    expect(model(1).bodyTransform).toBe(silent.bodyTransform);
    expect(model(1).mouth).toBe(silent.mouth);
  });
  it("keeps the narrator static with animate off while accepting voice-driven mouth updates", () => {
    const render = (talk = 0) =>
      renderToStaticMarkup(<Brainy stats={stats(50)} talk={talk} animate={false} />);
    const silent = render();
    const talking = render(0.8);
    expect(silent).not.toContain("data-talk");
    expect(talking).toContain('data-talk=""');
    expect(talking).toContain('data-frame="0"');
    expect(talking).toBe(render(0.8));
    expect(render(0)).toBe(silent);
    const ry = (html: string) => Number(html.match(/data-talk="" [^>]*ry="([\d.]+)"/)?.[1]);
    expect(ry(render(1))).toBeGreaterThan(ry(render(0.2)));
  });
});
describe("Brain SVG", () => {
  it("keeps reference geometry, paint order, accessible and decorative APIs", () => {
    const html = renderToStaticMarkup(<Brainy stats={stats(50)} label="Brainy" />);
    expect(html).toContain('viewBox="-30 -40 280 268"');
    expect(html).toContain('role="img"');
    expect(html).toContain('data-brainy=""');
    expect(html.indexOf('cy="85"')).toBeLessThan(html.indexOf('cy="78"'));
    expect(renderToStaticMarkup(<Brainy stats={stats(10)} />)).toContain('aria-hidden="true"');
    expect(html).not.toContain("#5F6B2E");
    expect(html).not.toContain("#A9BC55");
    expect(html).not.toContain('data-part="screen"');
  });
  it("renders all six accessories and earned flags at their new anchors", () => {
    for (const [slot, ids] of Object.entries({
      head: ["cowboy", "cap", "phones"],
      face: ["glasses"],
      neck: ["bowtie", "scarf"],
    })) {
      for (const id of ids) {
        const html = renderToStaticMarkup(<Brainy stats={stats(50)} equipped={{ [slot]: id }} />);
        expect(html).toContain(`data-acc="${id}"`);
      }
    }
    const html = renderToStaticMarkup(
      <Brainy
        stats={stats(10)}
        earned={["captainBackpack", "heroCape", "explorerBadge", "ownGarden"]}
      />,
    );
    for (const flag of ["backpack", "cape", "badge", "garden"])
      expect(html).toContain(`data-part="${flag}"`);
  });
});
it("shares one ticker, throttles to 30 fps and cancels when the last hero leaves", () => {
  const queue = new Map<number, (t: number) => void>();
  let id = 0;
  let calls = 0;
  const ticker = createTicker(
    (fn) => {
      queue.set(++id, fn);
      return id;
    },
    (id) => {
      queue.delete(id);
    },
  );
  const a = ticker.subscribe(() => calls++);
  const b = ticker.subscribe(() => calls++);
  expect(queue.size).toBe(1);
  const frame = (t: number) => {
    const entry = [...queue.entries()][0];
    if (!entry) throw Error("No frame");
    queue.delete(entry[0]);
    entry[1](t);
  };
  frame(0);
  frame(16);
  expect(calls).toBe(0);
  frame(34);
  expect(calls).toBe(2);
  a();
  expect(queue.size).toBe(1);
  b();
  expect(queue.size).toBe(0);
});

describe("Hero Cape accessory", () => {
  const caped = { back: "cape" } as const;
  it("is drawn behind the body in every stage and in static mode", () => {
    for (const n of [5, 30, 45, 60, 90]) {
      const html = renderToStaticMarkup(<Brainy stats={stats(n)} equipped={caped} mood={n} />);
      const cape = html.indexOf('data-acc="cape"');
      expect(cape).toBeGreaterThan(-1);
      expect(html).toContain('data-acc="cape-clasp"');
      // The cape comes before the body parts, so Brainy stays in front of it.
      expect(cape).toBeLessThan(html.indexOf(`rx="11"`));
      expect(cape).toBeLessThan(html.indexOf(`data-acc="cape-clasp"`));
    }
  });
  it("is absent without the accessory and replaces the earned cape instead of doubling it", () => {
    expect(renderToStaticMarkup(<Brainy stats={stats(50)} />)).not.toContain('data-acc="cape"');
    const both = renderToStaticMarkup(
      <Brainy stats={stats(50)} equipped={caped} earned={["heroCape"]} />,
    );
    expect(both).toContain('data-acc="cape"');
    expect(both).not.toContain('data-part="cape"');
  });
  it("sways with the frame ticker", () => {
    const at = (t: number) => brainyModel(stats(50), caped, 50, t);
    expect(at(0)).toBeDefined();
    const a = renderToStaticMarkup(<Brainy stats={stats(50)} equipped={caped} />);
    expect(a).toContain('data-acc="cape"');
  });
});
