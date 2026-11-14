import { pathToFileURL } from "node:url";
import { getDatabaseConfig, openDatabase } from "@brainee/db";
import { expect, test } from "@playwright/test";
import { newFamily } from "./new-family";
import { savedState } from "./saved-state";

test("settings save child, PIN, zone; pair and revoke a child device; adult gate and logout", async ({
  page,
  browser,
  baseURL,
}, info) => {
  const headers = { origin: baseURL as string };
  await newFamily(page.request, baseURL as string);
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  await page.getByLabel("Child's name", { exact: true }).fill("Leah");
  await page.getByLabel("Child's promise: tasks per day").fill("2");
  await page.getByRole("button", { name: "Save", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Leah", exact: true })).toBeVisible();
  await page.getByLabel("Current PIN").fill("9999");
  await page.getByLabel("New PIN (4 digits)").fill("2468");
  await page.getByRole("button", { name: "Change PIN" }).click();
  await expect(page.getByRole("status")).toHaveText("Current PIN is incorrect");
  await page.getByLabel("Current PIN").fill("1234");
  await page.getByRole("button", { name: "Change PIN" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved");
  await page.getByRole("combobox", { name: "Timezone" }).selectOption("America/Los_Angeles");
  await page.getByRole("button", { name: "Save", exact: true }).last().click();
  await expect
    .poll(async () => (await savedState(page.request)).showcase.calendar?.timeZone)
    .toBe("America/Los_Angeles");
  await page.getByRole("button", { name: "New code" }).click();
  const code = await page.getByTestId("pairing-code").textContent();
  const child = await browser.newContext({ baseURL, viewport: page.viewportSize() });
  try {
    const device = await child.newPage();
    await device.goto("/child-login");
    await device.getByLabel("6-digit code").fill(code ?? "");
    await device.getByRole("button", { name: "Connect", exact: true }).click();
    await expect(device).toHaveURL(/\/entry$/);
    const childState = await savedState(device.request);
    expect(childState.child.name).toBe("Leah");
    expect(childState.parentUnlocked).toBe(false);
    expect((await device.request.get("/api/settings")).status()).toBe(401);
    expect(
      (
        await device.request.post("/api/settings", {
          headers,
          data: { type: "child", child: { name: "Wrong", birthYear: 2020, promise: 1 } },
        })
      ).status(),
    ).toBe(401);
    await page.reload();
    await expect(page.getByRole("button", { name: "Disconnect", exact: true })).toHaveCount(2);
    await page.screenshot({
      path: info.outputPath("settings.png"),
      fullPage: true,
      animations: "disabled",
    });
    const row = page
      .getByRole("listitem")
      .filter({ hasText: "Device" })
      .filter({ hasNotText: "This device" });
    await row.getByRole("button", { name: "Disconnect" }).click();
    await expect(device).toHaveURL(/\/login$/, { timeout: 10000 });
    await device.goto("/learn");
    await expect(device).toHaveURL(/\/login$/, { timeout: 10000 });
  } finally {
    await child.close();
  }
  await page.request.delete("/api/parent", { headers });
  await page.reload();
  for (const digit of "1234") await page.getByRole("button", { name: `Digit ${digit}` }).click();
  await expect(page.getByText("Incorrect PIN. Please try again.", { exact: true })).toBeVisible();
  for (const digit of "2468") await page.getByRole("button", { name: `Digit ${digit}` }).click();
  await expect(page.getByLabel("Child's name", { exact: true })).toBeVisible();
  await page.request.delete("/api/parent", { headers });
  await page.reload();
  await page.getByRole("button", { name: "Forgot PIN? Puzzle for adults" }).click();
  await page.getByLabel("Your answer").fill("67");
  await page.getByRole("button", { name: "Open dashboard" }).click();
  await expect(
    page.getByText("Incorrect answer. Please try again.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Your answer").fill("68");
  await page.getByRole("button", { name: "Open dashboard" }).click();
  await expect(page.getByLabel("Child's name", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Log out", exact: true }).last().click();
  await expect(page).toHaveURL(/\/login$/);
});

test("selected timezone drives midnight and Monday resets, and a higher stage celebrates", async ({
  page,
  baseURL,
}, info) => {
  const headers = { origin: baseURL as string };
  await newFamily(page.request, baseURL as string);
  await page.goto("/settings");
  await page.getByRole("combobox", { name: "Timezone" }).selectOption("America/Phoenix");
  await page.getByRole("button", { name: "Save", exact: true }).last().click();
  await expect
    .poll(async () => (await savedState(page.request)).showcase.calendar?.timeZone)
    .toBe("America/Phoenix");
  const before = await savedState(page.request);
  const connection = await openDatabase(
    getDatabaseConfig(pathToFileURL(info.config.metadata.databasePath as string).href),
  );
  try {
    await connection.client.execute({
      sql: "UPDATE showcases SET data = json_set(data, '$.calendar.day', '2020-01-01', '$.calendar.week', '2019-12-30', '$.weekGoal.earned', 5) WHERE child_id = ?",
      args: [before.child.id],
    });
    const after = await savedState(page.request);
    expect(after.showcase.weekGoal.earned).toBe(0);
    expect(after.showcase.calendar?.timeZone).toBe("America/Phoenix");
    await connection.client.execute({
      sql: "UPDATE brainy_states SET brain=24.8,eyes=24.8,mouth=24.8,arms=24.8,legs=24.8 WHERE child_id=?",
      args: [before.child.id],
    });
    await page.goto("/brainy");
    await expect(page.getByTestId("brainy-stat-eyes")).toBeVisible();
    const launch = await page.request.post("/api/sessions/start", {
      headers,
      data: { gameId: "odd-one-out", level: 1 },
    });
    const finish = await page.request.post("/api/sessions", {
      headers,
      data: {
        sessionId: (await launch.json()).sessionId,
        result: {
          gameId: "odd-one-out",
          level: 1,
          rounds: 4,
          mistakes: 0,
          corrections: 0,
          durationMs: 0,
        },
      },
    });
    expect(finish.status()).toBe(200);
    expect(
      (await savedState(page.request)).showcase.feed.some((item) => item.kind === "stage-up"),
    ).toBe(true);
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: info.outputPath("stage-up.png"), animations: "disabled" });
    await page.getByRole("button", { name: "Awesome!" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  } finally {
    connection.client.close();
  }
});
