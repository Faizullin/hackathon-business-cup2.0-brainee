import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Brainy } from "./Brainy";
import { brainyModel, mixColor } from "./model";
import { BRAINY_PRESETS } from "./presets";

const base = { brain: 50, eyes: 50, mouth: 50, arms: 50, legs: 50, resp: 50 };

describe("brainy visual thresholds", () => {
  it.each([
    ["brainStar", { brain: 73 }, { brain: 72 }],
    ["eyeCircles", { eyes: 44 }, { eyes: 45 }],
    ["sleepyZ", { eyes: 34 }, { eyes: 35 }],
    ["biceps", { arms: 56 }, { arms: 55 }],
    ["backpack", { resp: 70 }, { resp: 69 }],
  ] as const)("%s switches exactly at its threshold", (flag, on, off) => {
    expect(brainyModel({ ...base, ...on }).flags[flag]).toBe(true);
    expect(brainyModel({ ...base, ...off }).flags[flag]).toBe(false);
  });

  it("shows video screens only when the body average is below 38", () => {
    const at = (v: number) => ({ brain: v, eyes: v, mouth: v, arms: v, legs: v, resp: 0 });
    expect(brainyModel(at(37)).flags.screens).toBe(true);
    expect(brainyModel(at(38)).flags.screens).toBe(false);
  });

  it("hides the brain star under a hat", () => {
    expect(brainyModel({ ...base, brain: 90 }, { head: "cap" }).flags.brainStar).toBe(false);
  });

  it("shifts color from sleepy green to pink with the average", () => {
    expect(brainyModel(BRAINY_PRESETS.afterQuiz).fill).toBe("#a7bc8c");
    expect(
      brainyModel({ ...base, brain: 100, eyes: 100, mouth: 100, arms: 100, legs: 100 }).fill,
    ).toBe("#ff8fa3");
    expect(mixColor("#000000", "#ffffff", 0.5)).toBe("#808080");
  });
});

describe("<Brainy />", () => {
  it("renders the after-quiz preset sleepy and the now preset with backpack", () => {
    const sleepy = renderToStaticMarkup(<Brainy stats={BRAINY_PRESETS.afterQuiz} />);
    expect(sleepy).toContain('data-part="zz"');
    expect(sleepy).toContain('data-part="screen"');
    expect(sleepy).toContain('aria-label="Брейни"');
    const now = renderToStaticMarkup(
      <Brainy stats={BRAINY_PRESETS.now} equipped={{ face: "glasses" }} />,
    );
    expect(now).toContain('data-part="backpack"');
    expect(now).toContain('data-acc="glasses"');
    expect(now).not.toContain('data-part="zz"');
  });

  it("gives every instance unique clip-path ids", () => {
    const html = renderToStaticMarkup(
      <>
        <Brainy stats={base} />
        <Brainy stats={base} />
      </>,
    );
    const ids = [...html.matchAll(/<clipPath id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
  });
});
