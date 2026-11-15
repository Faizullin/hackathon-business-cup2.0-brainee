import { expect, test } from "@playwright/test";
import {
  answerChild,
  answerHabits,
  atStep,
  DEADLINE_KEY,
  next,
  openAt,
  score,
  typical,
} from "./funnel";
import { savedState } from "./saved-state";

test("a fresh device opens the funnel; the brain reacts to answers; age Other exits", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page).toHaveURL(/\/start#duration$/);
  await expect(page.getByTestId("jury-entry")).toBeVisible();
  expect(await score(page)).toBe(80);
  await expect(page.getByTestId("brain-panel")).not.toContainText("Brainy");
  await page.locator('[data-value="240+"]').click();
  await atStep(page, "content");
  await expect.poll(() => score(page)).toBe(62);
  await page.locator('[data-value="shorts"]').click();
  await atStep(page, "finish");
  expect(await score(page)).toBe(48);
  await page.getByTestId("funnel-back").click();
  await atStep(page, "content");
  expect(await score(page)).toBe(48);
  await page.locator('[data-value="learn"]').click();
  await atStep(page, "finish");
  expect(await score(page)).toBe(60);
  // Full rot effects are allowed only here, in the parent funnel (D-40).
  await expect(page.locator('[data-brainy][data-effects="full"]').first()).toBeVisible();
  await page.goto("/start?reset=1");
  await answerHabits(page);
  expect(await score(page)).toBeGreaterThanOrEqual(20);
  expect(await score(page)).toBeLessThanOrEqual(25);
  await atStep(page, "child");
  await page.locator('[data-age="other"]').click();
  await next(page);
  await expect(page.getByTestId("funnel-exit")).toBeVisible();
  await expect(page.getByText("Brainy is made for ages 4–10")).toBeVisible();
  await expect(page.getByTestId("start-plan")).toHaveCount(0);
});

test("full path ends in the app with the Starter Pack moment, then the device opens the app", async ({
  page,
}, info) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 650 });
  await page.goto("/start?reset=1");
  const tall: string[] = [];
  // The frame clips at 100svh on desktop, so test the clipped boxes, not the document.
  const fits = async (id: string) => {
    await page.waitForTimeout(150);
    const clipped = await page.evaluate(() => {
      const bad: string[] = [];
      const root = document.querySelector(".bc");
      if (root && root.scrollHeight > root.clientHeight + 1) bad.push("frame");
      for (const el of document.querySelectorAll(".bc .stage > *"))
        if (el.scrollHeight > el.clientHeight + 1) bad.push(String(el.className));
      return bad;
    });
    if (clipped.length) tall.push(`${id}: ${clipped.join(",")}`);
  };
  await fits("duration");
  await page.screenshot({ path: info.outputPath("screen-1.png") });
  for (const id of ["duration", "content", "finish", "handoff", "reading"]) {
    await atStep(page, id);
    await fits(id);
    await page.locator(`[data-value="${typical[id as keyof typeof typical]}"]`).click();
  }
  await atStep(page, "child");
  await fits("child");
  await page.getByLabel("Child’s first name (optional)").fill("leo");
  await page.locator('[data-age="6-7"]').click();
  await next(page);
  await atStep(page, "guilt");
  await fits("guilt");
  await page.locator('[data-n="4"]').click();
  await atStep(page, "limits");
  await page.locator('[data-n="5"]').click();
  await atStep(page, "attempt");
  await fits("attempt");
  await page.locator('[data-value="limits"]').click();
  await next(page);
  await atStep(page, "analyze");
  await fits("analyze");
  await expect(page.getByRole("heading", { name: "Checking Leo’s answers" })).toBeVisible();
  await atStep(page, "reveal", 25_000);
  await fits("reveal");
  await expect(page.getByRole("heading", { name: "This is Leo’s Brainy today" })).toBeVisible();
  await page.getByRole("button", { name: "Can it get better?" }).click();
  await atStep(page, "ontime");
  await fits("ontime");
  await expect(page.getByText("14×")).toBeVisible();
  await next(page);
  await atStep(page, "goal");
  await fits("goal");
  await page.locator('[data-value="finish"]').click();
  await next(page);
  await atStep(page, "solution");
  await fits("solution");
  await expect(page.getByText("Leo today")).toBeVisible();
  await expect(page.getByText("In 4 weeks")).toBeVisible();
  await page.getByRole("button", { name: /Build Leo’s plan/ }).click();
  await atStep(page, "minutes");
  await fits("minutes");
  await page.locator('[data-value="15"]').click();
  await atStep(page, "gift");
  await fits("gift");
  await page.locator('[data-gift="movie"]').click();
  await atStep(page, "build");
  await fits("build");
  const ask = page.getByRole("dialog");
  await expect(ask).toBeVisible();
  await expect(ask).toContainText("Should Leo earn screen time instead of just getting it?");
  await ask.getByRole("button", { name: "Yes" }).click();
  await atStep(page, "email", 25_000);
  await fits("email");
  await next(page);
  await atStep(page, "offer");
  await fits("offer");
  expect(tall).toEqual([]);
  await expect(page.getByTestId("starter-clock")).toHaveText(/^1[45]:\d\d$/);
  await expect(page.getByText("$79.99", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("$179.88", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Save 56%")).toBeVisible();
  await page.screenshot({ path: info.outputPath("offer.png") });
  await page.getByTestId("start-plan").click();
  await expect(page).toHaveURL(/\/entry$/);
  const unlock = page.getByTestId("starter-unlock");
  await expect(unlock).toBeVisible();
  await expect(page.getByTestId("starter-badge")).toHaveText(/Exclusive/);
  await expect(unlock.getByRole("heading", { name: "Starter Pack unlocked" })).toBeVisible();
  await expect(page.getByTestId("starter-bank")).toHaveText("★ 150");
  await page.screenshot({ path: info.outputPath("unlock.png") });
  const state = await savedState(page.request);
  expect(state.child.name).toBe("Leo");
  expect(state.progress.wallet.stars).toBe(150);
  expect(state.showcase.owned).toContain("cape");
  expect(state.showcase.equipped.back).toBe("cape");
  expect(state.showcase.startPlan).toMatchObject({ plan: "annual", gift: "movie", minutes: 15 });
  expect(state.progress.mood).toBeLessThan(45);
  await page.getByTestId("starter-go").click();
  await expect(unlock).toHaveCount(0);
  await expect
    .poll(async () => (await savedState(page.request)).showcase.starterPack)
    .toBe("claimed");
  // The funnel brain is the only place with full effects; child screens stay kid-safe.
  await expect(page.locator('[data-effects="full"]')).toHaveCount(0);
  await page.goto("/");
  await expect(page).toHaveURL(/\/entry$/);
  await expect(page.getByTestId("starter-unlock")).toHaveCount(0);
  for (const path of ["/brainy", "/learn", "/gifts"]) {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator('[data-effects="full"]')).toHaveCount(0);
  }
  // Wardrobe: exclusive ribbon, no buy button for the cape.
  await page.goto("/brainy");
  const wardrobe = page.getByTestId("wardrobe-exclusive");
  await expect(wardrobe).toContainText("Exclusive · Starter Pack");
  await expect(page.getByRole("button", { name: /Buy/ })).not.toHaveCount(0);
  await expect(wardrobe.getByRole("button", { name: /Buy/ })).toHaveCount(0);
  // A device that already has a family offers to open it, and can start the quiz over.
  await page.goto("/start");
  await expect(page.getByTestId("open-app")).toBeVisible();
  await page.getByTestId("start-over").click();
  await atStep(page, "duration");
  expect(await score(page)).toBe(80);
});

test("an expired Starter Pack timer keeps prices and grants nothing", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/start");
  await page.evaluate(
    ([key, past]) => localStorage.setItem(key as string, String(past)),
    [DEADLINE_KEY, Date.now() - 1000],
  );
  await openAt(page, "offer");
  await expect(page.getByTestId("starter-strip")).toHaveText(
    "Starter Pack expired. Plans and prices stay the same.",
  );
  await expect(page.getByTestId("starter-bonus")).toHaveClass(/gone/);
  await expect(page.getByText("$79.99", { exact: true }).first()).toBeVisible();
  await page.locator('[data-plan="monthly"]').click();
  await expect(page.getByText("$14.99 today, then $14.99 every month")).toBeVisible();
  await page.getByTestId("start-plan").click();
  await expect(page).toHaveURL(/\/entry$/);
  await expect(page.getByTestId("starter-unlock")).toHaveCount(0);
  const state = await savedState(page.request);
  expect(state.progress.wallet.stars).toBe(50);
  expect(state.showcase.owned).not.toContain("cape");
  expect(state.showcase.startPlan?.plan).toBe("monthly");
});

test("Jury entry works from a mid-funnel screen", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/start?reset=1");
  await answerHabits(page);
  await answerChild(page);
  await atStep(page, "analyze");
  await page.getByTestId("jury-entry").click();
  await expect(page).toHaveURL(/\/jury$/);
  await expect(page.getByTestId("jury-pin")).toHaveText(/^\d{4}$/);
});
