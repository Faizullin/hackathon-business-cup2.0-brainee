import { expect, test } from "@playwright/test";
import { openAt } from "./funnel";
import { newFamily } from "./new-family";

test("login offers the current child without hiding the form", async ({ page, baseURL }) => {
  await newFamily(page.request, baseURL as string);
  await page.goto("/login");
  await expect(page.getByRole("link", { name: /^Continue as / })).toBeVisible();
  await expect(page.locator("input[name=email]:visible")).toBeVisible();
});

test("Start preserves credentials through a new tab until acknowledged", async ({
  page,
  context,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openAt(page, "offer");
  await page.getByTestId("start-plan").click();
  await expect(page).toHaveURL(/\/entry$/);
  await page.getByTestId("starter-go").click();
  await expect(page.getByTestId("family-login-email")).toBeVisible();
  const other = await context.newPage();
  await other.goto("/entry");
  await expect(other.getByTestId("family-login-email")).toBeVisible();
  await other.getByRole("button", { name: "I saved it", exact: true }).click();
  await other.reload();
  await expect(other.getByTestId("family-login")).toHaveCount(0);
  await expect(other.getByTestId("recommended-game").first()).toBeVisible();
});

test("login network failure releases submit and offers retry", async ({ page }) => {
  await page.goto("/login");
  await page.route("**/api/auth/login", (route) => route.abort());
  await page.locator("input[name=email]:visible").fill("parent@example.com");
  await page.locator("input[name=password]:visible").fill("secret123");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.locator("p[role=alert]")).toContainText("try again");
  await expect(page.getByRole("button", { name: "Log in", exact: true })).toBeEnabled();
});

test("jury shortcut is quiet and keeps a touch target", async ({ page }) => {
  await page.goto("/start");
  const shortcut = page.getByTestId("jury-entry");
  await expect(shortcut).toContainText("Skip to a demo family");
  expect((await shortcut.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  expect(await shortcut.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
    "rgba(0, 0, 0, 0)",
  );
});

test("PIN network failure releases keypad", async ({ page, baseURL }) => {
  await newFamily(page.request, baseURL as string);
  await page.request.delete("/api/parent", { headers: { origin: baseURL as string } });
  await page.goto("/analytics");
  await page.route("**/api/parent", (route) => route.abort());
  for (const digit of "1234") await page.getByRole("button", { name: `Digit ${digit}` }).click();
  await expect(page.locator("p[role=alert]")).toContainText("try again");
  await expect(page.getByRole("button", { name: "Digit 1", exact: true })).toBeEnabled();
});

test("signup distinguishes conflict and unavailable", async ({ page }) => {
  await openAt(page, "offer");
  await page.goto("/signup");
  await page.getByLabel("Child's name", { exact: true }).fill("Leo");
  await page
    .getByLabel("Birth year", { exact: true })
    .fill(String(new Date().getUTCFullYear() - 6));
  await page.locator("input[name=email]:visible").fill("parent@example.com");
  await page.getByLabel("Password (at least 6 characters)").fill("secret123");
  await page.getByLabel("Parent PIN (4 digits)").fill("1234");
  for (const status of [409, 503]) {
    await page.route("**/api/onboarding", (route) =>
      route.fulfill({ status, json: { error: "failed" } }),
    );
    await page.getByRole("button", { name: "Create & start" }).click();
    await expect(page.locator("p[role=alert]")).toContainText(
      status === 409 ? "Email already used" : "try again",
    );
    await page.unroute("**/api/onboarding");
  }
});

test("pairing code announces pending", async ({ page, baseURL }) => {
  await newFamily(page.request, baseURL as string);
  await page.route("**/api/pairing", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.continue();
  });
  await page.goto("/onboarding/setup");
  await expect(page.getByTestId("setup-code")).toContainText("Creating code");
  await expect(page.getByTestId("setup-code")).toHaveText(/^\d{6}$/);
});

test("logout asks before leaving", async ({ page, baseURL }) => {
  await newFamily(page.request, baseURL as string);
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Log out", exact: true }).last().click();
  await expect(page.getByRole("dialog", { name: "Log out?" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("pending login blocks duplicate submits and recovers from server failure", async ({
  page,
}) => {
  await page.goto("/login");
  let calls = 0;
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/auth/login", async (route) => {
    calls++;
    await gate;
    await route.fulfill({ status: 503, json: { error: "unavailable" } });
  });
  await page.locator("input[name=email]:visible").fill("parent@example.com");
  await page.locator("input[name=password]:visible").fill("secret123");
  await page.locator("form:visible").evaluate((form: HTMLFormElement) => {
    form.requestSubmit();
    form.requestSubmit();
  });
  const pending = page.getByRole("button", { name: "Signing in…" });
  await expect(pending).toBeDisabled();
  await expect(pending).toHaveAttribute("aria-busy", "true");
  expect(calls).toBe(1);
  release();
  await expect(page.locator("p[role=alert]")).toContainText("try again");
  await expect(page.getByRole("button", { name: "Log in", exact: true })).toBeEnabled();
});

test("settings network failure releases save", async ({ page, baseURL }) => {
  await newFamily(page.request, baseURL as string);
  await page.goto("/settings");
  await page.getByLabel("Child's name", { exact: true }).fill("Leo");
  await page.route("**/api/settings", (route) =>
    route.request().method() === "POST" ? route.abort() : route.continue(),
  );
  await page.getByRole("button", { name: "Save", exact: true }).first().click();
  await expect(page.getByRole("status")).toContainText("try again");
  await expect(page.getByRole("button", { name: "Save", exact: true }).first()).toBeEnabled();
});
