import { expect, type FrameLocator, type Page, test } from "@playwright/test";
import { newFamily } from "./new-family";
import { savedState } from "./saved-state";

/**
 * GSP Phaser Explore previews (Shape Pairs, Color Boxes, Sticker Scene).
 * Real pointer input only: the scene's read-only `view()` reports where things are drawn,
 * and the test clicks/drags there. No game state is changed from the test.
 */
type Point = { x: number; y: number };
type View = {
  ready: boolean;
  menuOpen: boolean;
  completed: boolean;
  groups?: { id: string; done: boolean; x: number; y: number }[][];
  matched?: string[];
  boxes?: (Point & { color: string })[];
  tray?: (Point & { id: string; color?: string; shown: boolean; target?: Point })[];
  sorted?: unknown[];
  placed?: unknown[];
};

async function view(page: Page, scene: string): Promise<View> {
  const frame = page.frames().find((f) => f.url().includes("/games/"));
  if (!frame) throw new Error("Game frame missing");
  return frame.evaluate(
    (key) =>
      (
        window as unknown as {
          __PHASER_GAME__: { scene: { getScene(key: string): { view(): View } } };
        }
      ).__PHASER_GAME__.scene
        .getScene(key)
        .view(),
    scene,
  );
}

/** Scene coordinates are iframe CSS pixels; the pointer moves in page pixels. */
async function toPage(page: Page, point: Point): Promise<Point> {
  const box = await page.getByTestId("explore-frame").boundingBox();
  if (!box) throw new Error("Frame not laid out");
  return { x: box.x + point.x, y: box.y + point.y };
}

async function drag(page: Page, from: Point, to: Point) {
  const a = await toPage(page, from);
  const b = await toPage(page, to);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  for (let step = 1; step <= 12; step++)
    await page.mouse.move(a.x + ((b.x - a.x) * step) / 12, a.y + ((b.y - a.y) * step) / 12);
  await page.mouse.up();
}

async function tap(page: Page, point: Point) {
  const p = await toPage(page, point);
  await page.mouse.click(p.x, p.y, { delay: 40 });
}

const GAMES: {
  id: string;
  scene: string;
  play(page: Page): Promise<void>;
}[] = [
  {
    id: "shape-pairs",
    scene: "ShapePairsScene",
    async play(page) {
      const v = await view(page, "ShapePairsScene");
      const [left = [], right = []] = v.groups ?? [];
      const tile = left.find((t) => !t.done);
      const twin = right.find((t) => t.id === tile?.id);
      if (!tile || !twin) throw new Error("No open pair");
      await tap(page, tile);
      await tap(page, twin);
      await expect
        .poll(async () => (await view(page, "ShapePairsScene")).matched?.length)
        .toBeGreaterThan(0);
    },
  },
  {
    id: "color-boxes",
    scene: "ColorSortScene",
    async play(page) {
      const v = await view(page, "ColorSortScene");
      const item = v.tray?.find((entry) => entry.shown);
      const box = v.boxes?.find((entry) => entry.color === item?.color);
      if (!item || !box) throw new Error("No sortable picture");
      await drag(page, item, box);
      await expect
        .poll(async () => (await view(page, "ColorSortScene")).sorted?.length)
        .toBeGreaterThan(0);
    },
  },
  {
    id: "sticker-scene",
    scene: "StickerScene",
    async play(page) {
      const before = (await view(page, "StickerScene")).placed?.length ?? 0;
      const sticker = (await view(page, "StickerScene")).tray?.find((entry) => entry.shown);
      if (!sticker?.target) throw new Error("No sticker to place");
      // Let the tray settle so the pointer lands on the sticker it read.
      await page.waitForTimeout(400);
      const settled = (await view(page, "StickerScene")).tray?.find((e) => e.id === sticker.id);
      await drag(page, settled ?? sticker, sticker.target);
      await expect
        .poll(async () => (await view(page, "StickerScene")).placed?.length)
        .toBeGreaterThan(before);
    },
  },
];

for (const game of GAMES)
  test(`${game.id}: Explore preview plays with real input, stays English, own origin, no rewards`, async ({
    page,
    baseURL,
  }, info) => {
    await newFamily(page.request, baseURL as string);
    const before = await savedState(page.request);
    const errors: string[] = [],
      foreign: string[] = [],
      scoring: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("request", (r) => {
      const u = new URL(r.url());
      if (u.protocol.startsWith("http") && u.origin !== baseURL) foreign.push(r.url());
      if (u.pathname.startsWith("/api/sessions")) scoring.push(r.url());
    });
    await page.goto(`/explore/${game.id}`);
    const iframe = page.getByTestId("explore-frame");
    await expect(iframe).toHaveAttribute("data-ready", "true", { timeout: 10000 });
    await expect(iframe).toHaveAttribute("allow", /microphone 'none'/);
    const frame: FrameLocator = page.frameLocator('[data-testid="explore-frame"]');
    await expect.poll(async () => (await view(page, game.scene)).ready).toBe(true);
    // English-only menu: no language picker, no Cyrillic copy.
    await expect(frame.locator("#game-language")).toHaveCount(0);
    expect(await frame.locator("body").innerText()).not.toMatch(/[Ѐ-ӿ]/);
    await frame.locator("#start-game").click({ delay: 40 });
    await expect.poll(async () => (await view(page, game.scene)).menuOpen).toBe(false);
    await page.screenshot({ path: info.outputPath(`${game.id}-start.png`) });
    await game.play(page);
    await page.screenshot({ path: info.outputPath(`${game.id}-play.png`) });

    await page.getByRole("link", { name: /Exit/ }).click();
    await expect(page).toHaveURL(/\/explore$/);
    await expect(page.getByTestId("explore-frame")).toHaveCount(0);
    const after = await savedState(page.request);
    expect(after.progress.wallet).toEqual(before.progress.wallet);
    expect(after.progress.skills).toEqual(before.progress.skills);
    expect(after.progress.stats).toEqual(before.progress.stats);
    expect(scoring).toEqual([]);
    expect(foreign).toEqual([]);
    expect(errors).toEqual([]);
  });
