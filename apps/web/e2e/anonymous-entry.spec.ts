import { expect, test } from "@playwright/test";

test("without shared-demo access: anonymous learn and logout never attach Mia", async ({
  page,
  baseURL,
}) => {
  test.skip(
    process.env.BRAINEE_SHARED_DEMO !== "0",
    "Run alone with BRAINEE_SHARED_DEMO=0 to test the production flag boundary.",
  );
  const response = await page.request.post("/api/demo-session", {
    headers: { origin: baseURL as string },
  });
  expect(response.status()).toBe(401);
  await page.goto("/learn");
  await expect(page).toHaveURL(/\/start#duration$/);
  expect((await page.request.get("/api/state")).status()).toBe(401);
  await page.getByTestId("jury-entry").click();
  await expect(page).toHaveURL(/\/jury$/);
  const state = (await (await page.request.get("/api/state")).json()).snapshot;
  expect(state.child.id).not.toBe("demo-child");
  expect(state.child.name).not.toBe("Mia");
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Log out", exact: true }).last().click();
  const dialog = page.getByRole("dialog", { name: "Log out?" });
  await expect(dialog.getByTestId("family-login-email")).toBeVisible();
  await dialog.getByRole("button", { name: "Confirm log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/learn");
  await expect(page).toHaveURL(/\/start#duration$/);
  expect((await page.request.get("/api/state")).status()).toBe(401);
});
