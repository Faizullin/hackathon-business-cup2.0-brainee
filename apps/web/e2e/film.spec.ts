import { expect, test } from "@playwright/test";
import { savedState } from "./saved-state";

// Interactive film (docs/dev/films.md): real mp3 + script; questions pause the audio.
test.beforeEach(async ({ page, baseURL }) => {
  const headers = { origin: baseURL as string };
  expect((await page.request.post("/api/demo-session", { headers })).ok()).toBe(true);
  // Resetting demo data is a parent action (D-29): unlock, reset, lock again.
  await page.request.post("/api/parent", { headers, data: { pin: "1234" } });
  expect((await page.request.post("/api/demo-reset", { headers })).ok()).toBe(true);
  await page.request.delete("/api/parent", { headers });
});

const audio = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const a = document.querySelector("audio") as HTMLAudioElement;
    return { paused: a.paused, time: a.currentTime };
  });

test("film: question pauses the audio, hint on a miss, praise resumes, no stars", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await page.goto("/learn");
  await page.getByRole("link", { name: /Why the sky is blue\?/ }).click();
  await expect(page).toHaveURL(/\/video\/sky-blue$/);
  const film = page.getByTestId("film");
  await expect(film.locator("[data-film-stage]")).toHaveAttribute("data-bg", "yard");
  await expect(page.getByRole("slider")).toHaveCount(0);
  const before = await savedState(page.request);

  await page.getByTestId("film-toggle").click();
  await expect.poll(async () => (await audio(page)).paused).toBe(false);
  await expect(film.locator("[data-talk]")).toHaveCount(1, { timeout: 5000 });

  const question = page.getByTestId("film-question");
  await expect(question).toBeVisible({ timeout: 20_000 });
  const paused = await audio(page);
  expect(paused.paused).toBe(true);
  expect(paused.time).toBeGreaterThan(10.6);
  expect(paused.time).toBeLessThan(11.2); // before "Yes, blue!" at 11.4 s
  await expect(film.locator('[data-prop="question"]')).toBeVisible();
  await expect(film.locator("[data-brainy-spot]")).toHaveAttribute("data-brainy-spot", "center");

  await question.getByRole("button", { name: "Pink" }).click();
  await expect(question.getByRole("button", { name: "Pink" })).toBeDisabled();
  await expect(question.getByRole("alert")).toHaveText("Almost! Look up on a sunny day.");
  await expect(question.getByRole("button", { name: "Listen again" })).toBeVisible();
  await question.getByRole("button", { name: "Blue" }).click();
  await expect(question.getByRole("status")).toContainText("On a sunny day the sky is blue");
  await expect(question).toBeHidden({ timeout: 5000 });
  await expect.poll(async () => (await audio(page)).paused).toBe(false);

  expect((await savedState(page.request)).progress.wallet.stars).toBe(before.progress.wallet.stars);
  expect(errors).toEqual([]);
});

test("film: the child's own Brainy leads it, wearing what the child bought", async ({
  page,
  baseURL,
}) => {
  const headers = { origin: baseURL as string };
  for (const data of [
    { type: "buy-accessory", id: "bowtie" },
    { type: "equip", id: "bowtie" },
  ])
    expect((await page.request.post("/api/actions", { headers, data })).ok()).toBe(true);
  await page.goto("/video/rain");
  const narrator = page.getByTestId("film").locator("[data-narrator]");
  await expect(narrator.locator('[data-acc="glasses"]')).toHaveCount(1);
  await expect(narrator.locator('[data-acc="bowtie"]')).toHaveCount(1);
});

test("film studio swaps the mascot without touching the film", async ({ page }) => {
  await page.goto("/lab/film");
  await expect(page.getByTestId("film-issues")).toContainText("No errors or warnings");
  const narrator = page.locator("[data-narrator]");
  await expect(narrator).toHaveCount(1);
  await page.getByTestId("film-narrator").selectOption("dressed");
  await expect(narrator.locator('[data-acc="cap"]')).toHaveCount(1);
  await page.getByTestId("film-narrator").selectOption("none");
  await expect(narrator).toHaveCount(0);
  await expect(page.locator("[data-film-stage] [data-prop]").first()).toBeVisible();
});

test("film studio checks the shipped script", async ({ page }) => {
  await page.goto("/lab/film");
  await expect(page.getByTestId("film-issues")).toContainText("No errors or warnings");
  await expect(page.getByRole("slider")).toBeVisible();
});
