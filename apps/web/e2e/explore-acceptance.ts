import { expect, type FrameLocator, type Page, test } from "@playwright/test";
import { newFamily } from "./new-family";
import { savedState } from "./saved-state";
export function exploreAcceptance(id: string) {
  test(`${id}: real exploration, own origin, exit, no learning rewards`, async ({
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
      if (u.origin !== baseURL) foreign.push(r.url());
      if (u.pathname.startsWith("/api/sessions")) scoring.push(r.url());
    });
    await page.goto(`/explore/${id}`);
    const iframe = page.getByTestId("explore-frame");
    await expect(iframe).toHaveAttribute("data-ready", "true", { timeout: 10000 });
    const frame = iframe.contentFrame();
    await expect(frame.getByTestId("host-badge")).toContainText("no stars");
    await expect(iframe).toHaveAttribute("allow", /microphone 'none'/);
    await page.screenshot({ path: info.outputPath(`${id}-start.png`), fullPage: true });
    await playExplore(page, id, frame);
    await page.screenshot({ path: info.outputPath(`${id}-play.png`), fullPage: true });
    await frame.getByTestId("host-exit-button").click({ delay: 60 });
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
}

export async function playExplore(page: Page, id: string, frame: FrameLocator) {
  if (id === "magnet-explorer") {
    await frame.locator('[data-mode="test-lab"]').click({ delay: 60 });
    await expect(frame.locator(".test-pedestal")).toBeVisible();
    const target = await frame.locator(".test-object").boundingBox();
    if (!target) throw new Error("Missing test object");
    await frame.locator(".magnet-tool").hover();
    await page.mouse.down();
    await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, {
      steps: 8,
    });
    await page.mouse.up();
  } else {
    await frame.locator('[data-target="start"]').click({ delay: 60 });
    const house = frame.locator("#house-canvas");
    await expect(house).toBeVisible();
    const box = await house.boundingBox();
    if (!box) throw new Error("Missing drawing canvas");
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5, { steps: 8 });
    await page.mouse.up();
    await frame.locator('[data-target="house-done"]').click({ delay: 60 });
    await frame.locator('[data-target="magic-next"]').click({ delay: 60 });
    const road = frame.locator("#road-canvas");
    await expect(road).toBeVisible();
    const rb = await road.boundingBox();
    if (!rb) throw new Error("Missing road canvas");
    await page.mouse.move(rb.x + rb.width * 0.2, rb.y + rb.height * 0.3);
    await page.mouse.down();
    await page.mouse.move(rb.x + rb.width * 0.7, rb.y + rb.height * 0.7, { steps: 8 });
    await page.mouse.up();
    await frame.locator('[data-target="road-done"]').click({ delay: 60 });
    await frame.locator('.place-choice[data-place="tree"]').click({ delay: 60 });
  }
}
