import { expect, test } from "@playwright/test";

test("English child and parent loop, with Russian seeded-content smoke", async ({
  page,
  context,
  baseURL,
}, info) => {
  await context.addCookies([{ name: "brainee_locale", value: "en", url: baseURL as string }]);
  const headers = { origin: baseURL as string };
  const join = await page.request.post("/api/jury", { headers });
  expect(join.ok()).toBe(true);
  const { credentials } = await join.json();
  await page.request.delete("/api/parent", { headers });
  await page.goto("/entry");
  await expect(page.getByRole("heading", { name: "What are we playing now?" })).toBeVisible();
  for (const path of ["learn", "leisure", "gifts", "brainy"]) {
    await page.goto(`/${path}`);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect((await page.locator("main").innerText()).replaceAll("Русский", "")).not.toMatch(
      /[А-Яа-яЁё]/,
    );
  }
  await page.goto("/game/odd-one-out?seed=42");
  const shapes = page.getByRole("button", { name: /^Shape \d+$/ });
  await expect(shapes).toHaveCount(9);
  const svg = await shapes
    .locator("svg")
    .evaluateAll((nodes) => nodes.map((node) => node.innerHTML));
  await shapes
    .nth(svg.findIndex((shape) => svg.filter((other) => other === shape).length === 1))
    .click();
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeVisible();
  await page.goto("/analytics");
  for (const n of credentials.pin)
    await page.getByRole("button", { name: `Digit ${n}`, exact: true }).click();
  for (const path of ["analytics", "tasks", "settings"]) {
    await page.goto(`/${path}`);
    await expect(page.locator("h1").first()).toBeVisible();
    expect((await page.locator("main").innerText()).replaceAll("Русский", "")).not.toMatch(
      /[А-Яа-яЁё]/,
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath(`${path}-en.png`), fullPage: true });
  }
  await context.addCookies([{ name: "brainee_locale", value: "ru", url: baseURL as string }]);
  for (const path of ["gifts", "tasks", "analytics"]) {
    await page.goto(`/${path}`);
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");
    await expect(page.locator("h1").first()).toBeVisible();
    expect((await page.locator("main").innerText()).replaceAll("Русский", "")).not.toMatch(
      /Tidy up|Read a book|Movie theater|Responsibility|Attention|Learning machine|Sophia N\.|Olivia K\./,
    );
  }
});
