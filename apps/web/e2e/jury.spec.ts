import { expect, test } from "@playwright/test";
import { newFamily } from "./new-family";
import { answerOddOneOut } from "./play-game";
import { savedState } from "./saved-state";

test("jury joins in one tap; families stay isolated; game ten completes an app task and celebrates a real badge", async ({
  page,
  browser,
  baseURL,
}, info) => {
  const foreign: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith("http") && url.origin !== baseURL) foreign.push(request.url());
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Join as Jury" }).click();
  await expect(page).toHaveURL(/\/jury$/);
  await expect(page.getByTestId("jury-pin")).toHaveText(/^\d{4}$/);
  const a = await savedState(page.request);
  expect(a.activity?.completed).toBe(9);
  const other = await browser.newContext({ baseURL });
  try {
    expect(
      (await other.request.post("/api/jury", { headers: { origin: baseURL as string } })).status(),
    ).toBe(201);
    const b = await savedState(other.request);
    expect(b.child.id).not.toBe(a.child.id);
    await page.screenshot({
      path: info.outputPath("jury.png"),
      fullPage: true,
      animations: "disabled",
    });
    await page.getByRole("link", { name: "View as Child" }).click();
    await expect(page).toHaveURL(/\/entry$/);
    await page.goto("/path");
    await expect(page.getByText("9 / 10", { exact: true })).toBeVisible();
    await page.goto("/game/odd-one-out?recommended=1&seed=42");
    await answerOddOneOut(page);
    await expect(page.getByRole("dialog", { name: "New reward!" })).toBeVisible();
    await expect(
      page.getByRole("dialog").getByText("Explorer Badge", { exact: true }),
    ).toBeVisible();
    await page.screenshot({ path: info.outputPath("earned.png"), animations: "disabled" });
    await page.getByRole("button", { name: "Awesome!" }).click();
    const after = await savedState(page.request);
    expect(after.progress.wallet.stars).toBe(a.progress.wallet.stars + 27);
    expect(after.showcase.tasks.find((t) => t.id === "jury-app")?.status).toBe("done");
    expect(after.activity?.completed).toBe(10);
    expect(after.activity?.recommendedFinished).toBe(10);
    expect((await savedState(other.request)).progress.wallet).toEqual(b.progress.wallet);
    await page.goto("/analytics");
    await expect(page.getByTestId("computed-analytics")).toBeVisible();
    await expect(page.locator("li").filter({ hasText: "Average focus session" })).toContainText(
      `${after.activity?.focusMinutes} min`,
    );
    await expect(
      page.locator("li").filter({ hasText: "Chooses Brainy recommendations" }),
    ).toContainText(`${after.activity?.takesRecommendation}%`);
    await expect(page.getByText(/Finished: 10 of 10 recommended games/)).toBeVisible();
    await expect(page.getByTestId("event-feed")).toContainText("Explorer Badge");
    await page.screenshot({
      path: info.outputPath("analytics-real.png"),
      fullPage: true,
      animations: "disabled",
    });
    await page.goto("/settings");
    await page.getByRole("button", { name: "Reset demo" }).click();
    await expect(page.getByRole("status")).toHaveText("Saved");
    expect((await savedState(other.request)).child.id).toBe(b.child.id);
    expect(foreign).toEqual([]);
  } finally {
    await other.close();
  }
});

test("funnel signup keeps setup pairing on the same family", async ({
  page,
  browser,
  baseURL,
}, info) => {
  await page.goto("/start");
  await page.evaluate(() =>
    localStorage.setItem(
      "brainy.us-parent-quiz.v2",
      JSON.stringify({
        version: 4,
        screen: "result",
        answers: {
          goal: "ending",
          age: "6-7",
          handoff: "bargain",
          content: "kids",
          finish: "switch",
          reading: "together",
          duration: "one",
          attempt: "timer",
          moment: "afternoon",
        },
      }),
    ),
  );
  await page.goto("/signup");
  await page.getByLabel("Child's name", { exact: true }).fill("Leah");
  await page
    .getByLabel("Birth year", { exact: true })
    .fill(String(new Date().getUTCFullYear() - 6));
  await page
    .getByLabel("Email", { exact: true })
    .fill(`pairing-${Date.now()}-${info.project.name}@example.com`);
  await page.getByLabel("Password (at least 6 characters)").fill("secret123");
  await page.getByLabel("Parent PIN (4 digits)").fill("2468");
  await page
    .getByRole("combobox", { name: "Timezone", exact: true })
    .selectOption("America/Chicago");
  await page.getByRole("button", { name: "Create & start" }).click();
  await expect(page).toHaveURL(/\/onboarding\/setup$/);
  const code = page.getByTestId("setup-code");
  await expect(code).toHaveText(/^\d{6}$/);
  const state = await savedState(page.request);
  expect(state.progress.stats.brain).toBe(20);
  expect(state.showcase.calendar?.timeZone).toBe("America/Chicago");
  await expect(page.getByText(baseURL as string, { exact: true })).toBeVisible();
  await page.screenshot({
    path: info.outputPath("setup.png"),
    fullPage: true,
    animations: "disabled",
  });
  const device = await browser.newContext({ baseURL });
  try {
    const child = await device.newPage();
    await child.goto("/child-login");
    await child.getByLabel("6-digit code").fill((await code.textContent()) ?? "");
    await child.getByRole("button", { name: "Connect", exact: true }).click();
    await expect(child).toHaveURL(/\/entry$/);
    expect((await savedState(device.request)).child.id).toBe(state.child.id);
  } finally {
    await device.close();
  }
  await page.getByRole("button", { name: "This is the child's device" }).click();
  await expect(page).toHaveURL(/\/entry$/);
  expect((await savedState(page.request)).parentUnlocked).toBe(false);
});

test("fun-game credit counts active play only", async ({ page, baseURL }, info) => {
  await newFamily(page.request, baseURL as string);
  const headers = { origin: baseURL as string };
  expect(
    (
      await page.request.post("/api/actions", {
        headers,
        data: { type: "unlock-fun", gameId: "snake", mode: "timed" },
      })
    ).ok(),
  ).toBe(true);
  await page.goto("/fun/snake");
  await expect(page.getByTestId("fun-time")).toContainText("10:00");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.getByTestId("fun-time")).toContainText("9:59");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect
    .poll(
      async () =>
        (await savedState(page.request)).showcase.fun.find((g) => g.id === "snake")
          ?.remainingSeconds,
    )
    .toBeLessThan(600);
  const left = (await savedState(page.request)).showcase.fun.find(
    (g) => g.id === "snake",
  )?.remainingSeconds;
  await page.screenshot({ path: info.outputPath("snake.png"), animations: "disabled" });
  await page.waitForTimeout(1200);
  expect(
    (await savedState(page.request)).showcase.fun.find((g) => g.id === "snake")?.remainingSeconds,
  ).toBe(left);
});
