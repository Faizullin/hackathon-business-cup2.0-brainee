import { expect, type Page } from "@playwright/test";

/** A typical iPad-kid path: lands around 24 / 100 on the brain meter. */
export const typical = {
  duration: "120-240",
  content: "shorts",
  finish: "switch",
  handoff: "more",
  reading: "rare",
} as const;

/** A full, valid draft as the funnel stores it, for jumping straight to later screens. */
export const fullDraft = {
  ...typical,
  age: "6-7",
  name: "Leo",
  guilt: 4,
  limits: 5,
  attempt: ["limits"],
  goal: ["finish", "read"],
  minutes: "15",
  gift: "movie",
};
export const STORAGE_KEY = "brainy.brain-check.v1";
export const DEADLINE_KEY = "brainy.brain-check.starter-deadline";

export const step = (page: Page) => page.getByTestId("parent-funnel");
export const atStep = (page: Page, id: string, timeout = 5000) =>
  expect(step(page)).toHaveAttribute("data-step", id, { timeout });
export const next = (page: Page) =>
  page.getByRole("button", { name: "Continue", exact: true }).click();
export const score = async (page: Page) =>
  Number(await page.getByTestId("brain-score").getAttribute("data-score"));

/** Stores a quiz state and opens the funnel at `screen`, without going through the loaders. */
export async function openAt(page: Page, screen: string, draft: object = fullDraft) {
  await page.goto("/start?tour=0");
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key as string, value as string),
    [STORAGE_KEY, JSON.stringify({ version: 1, screen, answers: draft })],
  );
  await page.goto(`/start#${screen}`);
  await atStep(page, screen);
}

export async function answerHabits(page: Page, answers: Record<string, string> = typical) {
  for (const id of ["duration", "content", "finish", "handoff", "reading"]) {
    await atStep(page, id);
    await page.locator(`[data-value="${answers[id]}"]`).click();
  }
}

/** Child, two scales, attempts; stops on the first loader. */
export async function answerChild(page: Page, name = "Leo", age = "6-7") {
  await atStep(page, "child");
  await page.getByLabel("Child’s first name (optional)").fill(name);
  await page.locator(`[data-age="${age}"]`).click();
  await next(page);
  await atStep(page, "guilt");
  await page.locator('[data-n="4"]').click();
  await atStep(page, "limits");
  await page.locator('[data-n="5"]').click();
  await atStep(page, "attempt");
  await page.locator('[data-value="limits"]').click();
  await next(page);
}
