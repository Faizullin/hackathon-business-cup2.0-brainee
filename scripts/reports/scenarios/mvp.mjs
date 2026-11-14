import assert from "node:assert/strict";

export { checkSurface } from "./common.mjs";

/** Fresh seeded tasks, gifts and videos (DEMO_MODE reset endpoint). */
export async function resetDemo(page, { base, timeline }) {
  const headers = { origin: base };
  assert.ok((await page.request.post(`${base}/api/demo-session`, { headers })).ok());
  assert.ok((await page.request.post(`${base}/api/demo-reset`, { headers })).ok());
  timeline.check(true, "Demo content reset to the seed");
}

export async function childTaskDone(page, { timeline }) {
  const task = page.getByTestId("child-task-t3");
  await task.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await task.getByRole("button", { name: "Готово!" }).click();
  await task.getByText("Ждёт подтверждения").waitFor();
  timeline.check(true, "Child marks a real-life task done → waits for the parent");
}

export async function buyCheapestAccessory(page, { timeline }) {
  const buy = page.getByRole("button", { name: "Купить · 50★" });
  await buy.scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await buy.click();
  await page.getByRole("button", { name: "Снять" }).first().waitFor();
  timeline.check(true, "Bought accessory is worn (one per slot)");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(900);
}

export async function scrollPage(page) {
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(650);
  }
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await page.waitForTimeout(400);
}

export async function openParentTab(page, { args }) {
  const navs = page.getByRole("navigation", { name: "Разделы родителя" });
  const visible = (await navs.first().isVisible()) ? navs.first() : navs.last();
  await visible.getByRole("link", { name: args.name }).click();
}

export async function confirmTask(page, { timeline }) {
  const task = page.getByTestId("parent-task-t3");
  await task.getByRole("button", { name: "Подтвердить" }).click();
  await task.getByText("Выполнено").waitFor();
  timeline.check(true, "Parent confirms → ☀ and weekly goal grow");
  await page.waitForTimeout(900);
}
