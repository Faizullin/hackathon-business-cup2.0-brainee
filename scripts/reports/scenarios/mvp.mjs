import assert from "node:assert/strict";

export { checkSurface } from "./common.mjs";

/**
 * Walk the Brain Check funnel (`/start`, D-40/D-41) from the first question to the offer.
 * `?tour=1` keeps the run in session storage and skips the device check; the walk stops
 * before "Start" so the seeded demo family stays the active one.
 */
export async function walkFunnel(page, { base, timeline }) {
  const at = (id, timeout = 10000) =>
    page.locator(`[data-testid="parent-funnel"][data-step="${id}"]`).waitFor({ timeout });
  const pick = async (selector, ms = 650) => {
    await page.waitForTimeout(ms);
    await page.locator(selector).filter({ visible: true }).first().click();
  };
  const next = () => page.getByRole("button", { name: "Continue", exact: true }).click();
  const habits = {
    duration: "120-240",
    content: "shorts",
    finish: "switch",
    handoff: "more",
    reading: "rare",
  };

  await page.goto(`${base}/start?tour=1#duration`);
  for (const [id, value] of Object.entries(habits)) {
    await at(id);
    await pick(`[data-value="${value}"]`, 900);
  }
  const score = Number(await page.getByTestId("brain-score").getAttribute("data-score"));
  assert.ok(score >= 20 && score <= 25, `typical habits land near 24 / 100, got ${score}`);
  timeline.check(true, "The brain meter drops as the parent answers the habit questions");

  await at("child");
  await page.getByLabel("Child’s first name (optional)").fill("Leo");
  await pick('[data-age="6-7"]', 400);
  await next();
  await at("guilt");
  await pick('[data-n="4"]');
  await at("limits");
  await pick('[data-n="5"]');
  await at("attempt");
  await pick('[data-value="limits"]');
  await next();
  await at("analyze");
  await at("reveal", 25000);
  await page.getByRole("heading", { name: "This is Leo’s Brainy today" }).waitFor();
  await page.waitForTimeout(1800);
  await page.getByRole("button", { name: "Can it get better?" }).click();
  await at("ontime");
  await page.waitForTimeout(1200);
  await next();
  await at("goal");
  await pick('[data-value="finish"]');
  await next();
  await at("solution");
  await page.getByText("In 4 weeks").waitFor();
  await page.waitForTimeout(1800);
  await page.getByRole("button", { name: /Build Leo’s plan/ }).click();
  await at("minutes");
  await pick('[data-value="15"]');
  await at("gift");
  await pick('[data-gift="movie"]');
  await at("build");
  const ask = page.getByRole("dialog");
  await ask.waitFor({ timeout: 15000 });
  await page.waitForTimeout(900);
  await ask.getByRole("button", { name: "Yes" }).click();
  await at("email", 25000);
  await page.waitForTimeout(600);
  await next();
  await at("offer");
  await page.getByText("$79.99", { exact: true }).first().waitFor();
  timeline.check(true, "Funnel ends on the offer: display-only prices, no payment (D-41)");
  await page.waitForTimeout(1200);
  await scrollPage(page);
}

/** Fresh seeded tasks, gifts and videos (DEMO_MODE reset endpoint). */
export async function resetDemo(page, { base, timeline }) {
  const headers = { origin: base };
  assert.ok((await page.request.post(`${base}/api/demo-session`, { headers })).ok());
  assert.ok(
    (await page.request.post(`${base}/api/parent`, { headers, data: { pin: "1234" } })).ok(),
  );
  assert.ok((await page.request.post(`${base}/api/demo-reset`, { headers })).ok());
  assert.ok((await page.request.delete(`${base}/api/parent`, { headers })).ok());
  timeline.check(true, "Demo content reset to the seed");
}

export async function childTaskDone(page, { timeline }) {
  const task = page.getByTestId("child-task-t3");
  await task.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await task.getByRole("button", { name: "Done!" }).click();
  await task.getByText("Awaiting confirmation").waitFor();
  timeline.check(true, "Child marks a real-life task done → waits for the parent");
}

export async function buyCheapestAccessory(page, { timeline }) {
  const buy = page.getByRole("button", { name: "Buy · 50★" });
  await buy.scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await buy.click();
  await page.getByRole("button", { name: "Remove" }).first().waitFor();
  timeline.check(true, "Bought accessory is worn (one per slot)");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(900);
}

export async function scrollPage(page) {
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => window.scrollBy(0, 700));
    await page.waitForTimeout(650);
  }
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await page.waitForTimeout(400);
}

export async function openParentTab(page, { args }) {
  const navs = page.getByRole("navigation", { name: "Parent sections" });
  const visible = (await navs.first().isVisible()) ? navs.first() : navs.last();
  await visible.getByRole("link", { name: args.name }).click();
}

export async function confirmTask(page, { timeline }) {
  const task = page.getByTestId("parent-task-t3");
  await task.getByRole("button", { name: "Confirm" }).click();
  await task.getByText("Completed").waitFor();
  timeline.check(true, "Parent confirms → ☀ and weekly goal grow");
  await page.waitForTimeout(900);
}
