import { expect, test } from "@playwright/test";
import { savedState } from "./saved-state";

// Interactive film (docs/dev/films.md): real mp3 + script; questions pause the audio.
test.beforeEach(async ({ page, baseURL }) => {
  const headers = { origin: baseURL as string };
  expect((await page.request.post("/api/demo-session", { headers })).ok()).toBe(true);
  expect((await page.request.post("/api/demo-reset", { headers })).ok()).toBe(true);
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
  await page.goto("/leisure");
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
  await expect(question.getByRole("button", { name: "Послушать ещё раз" })).toBeVisible();
  await question.getByRole("button", { name: "Blue" }).click();
  await expect(question.getByRole("status")).toContainText("On a sunny day the sky is blue");
  await expect(question).toBeHidden({ timeout: 5000 });
  await expect.poll(async () => (await audio(page)).paused).toBe(false);

  expect((await savedState(page.request)).progress.wallet.stars).toBe(before.progress.wallet.stars);
  expect(errors).toEqual([]);
});

test("film studio checks the shipped script", async ({ page }) => {
  await page.goto("/lab/film");
  await expect(page.getByTestId("film-issues")).toContainText("Ошибок и предупреждений нет");
  await expect(page.getByRole("slider")).toBeVisible();
});
