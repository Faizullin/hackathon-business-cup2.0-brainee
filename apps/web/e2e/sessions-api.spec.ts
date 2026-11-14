import { expect, test } from "@playwright/test";
import { newFamily } from "./new-family";

const result = {
  gameId: "odd-one-out",
  level: 1,
  rounds: 4,
  mistakes: 0,
  corrections: 0,
  durationMs: 0,
};

test("browser fetch uses its HttpOnly demo cookie for a saved game", async ({ page }) => {
  // Public pages do not bootstrap the child cookie; this test creates it explicitly.
  await page.goto("/login");
  const saved = await page.evaluate(async (result) => {
    const access = await fetch("/api/demo-session", { method: "POST" });
    const hidden = !document.cookie.includes("brainee_demo");
    const start = await fetch("/api/sessions/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: result.gameId, level: 1 }),
    });
    const { sessionId } = await start.json();
    const finish = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, result }),
    });
    return {
      access: access.status,
      start: start.status,
      finish: finish.status,
      hidden,
      body: await finish.json(),
    };
  }, result);
  expect(saved).toMatchObject({
    access: 201,
    start: 201,
    finish: 200,
    hidden: true,
    body: { replayed: false, completion: { earnedStars: 12 } },
  });
});

test("demo access is cookie-bound and a finish returns the same saved receipt on retry", async ({
  request,
  baseURL,
}) => {
  const headers = { origin: baseURL as string };
  expect((await request.get("/api/demo-session")).status()).toBe(401);
  const access = await request.post("/api/demo-session", { headers });
  expect(access.status()).toBe(201);
  expect(access.headers()["set-cookie"]).toContain("HttpOnly");
  expect(access.headers()["set-cookie"]).toContain("SameSite=lax");
  expect(access.headers()["cache-control"]).toBe("no-store");
  expect(await access.json()).toMatchObject({ child: { id: "demo-child", name: "Саша" } });
  expect(await access.text()).not.toMatch(/pin|hash|token|email/i);
  const cookie = (await request.storageState()).cookies.find(
    (cookie) => cookie.name === "brainee_demo",
  );
  expect(cookie?.httpOnly).toBe(true);
  expect((await request.post("/api/demo-session", { headers })).status()).toBe(200);
  expect(
    (await request.storageState()).cookies.find((cookie) => cookie.name === "brainee_demo")?.value,
  ).toBe(cookie?.value);
  expect((await request.get("/api/demo-session")).status()).toBe(200);
  const started = await request.post("/api/sessions/start", {
    headers,
    data: { gameId: result.gameId, level: 1, seed: 0 },
  });
  expect(started.status()).toBe(201);
  const { sessionId, seed } = await started.json();
  expect(seed).toBe(0);
  const body = { sessionId, result };
  const saved = await request.post("/api/sessions", { headers, data: body });
  expect(saved.status()).toBe(200);
  const first = await saved.json();
  expect(first).toMatchObject({
    replayed: false,
    completion: { earnedStars: 12 },
  });
  expect(first.completion.after.stats.eyes).toBe(
    Math.min(100, first.completion.before.stats.eyes + 3),
  );
  expect(first.completion.after.wallet.stars - first.completion.before.wallet.stars).toBe(12);
  const replay = await request.post("/api/sessions", { headers, data: body });
  expect(await replay.json()).toEqual({ ...first, replayed: true });
  expect(
    (
      await request.post("/api/sessions", {
        headers,
        data: { sessionId, result: { ...result, mistakes: 1, corrections: 1 } },
      })
    ).status(),
  ).toBe(409);
});

test("session routes reject foreign origins, unissued finishes, invalid JSON and fabricated rewards", async ({
  request,
  playwright,
  baseURL,
}) => {
  const headers = { origin: baseURL as string };
  expect((await request.post("/api/demo-session")).status()).toBe(403);
  expect(
    (
      await request.post("/api/demo-session", { headers: { origin: "https://foreign.invalid" } })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/sessions/start", {
        headers,
        data: { gameId: result.gameId, level: 1 },
      })
    ).status(),
  ).toBe(401);
  await request.post("/api/demo-session", { headers });
  expect(
    (
      await request.post("/api/sessions/start", {
        headers: { ...headers, "content-type": "application/json" },
        data: "{",
      })
    ).status(),
  ).toBe(400);
  expect((await request.post("/api/sessions/start", { headers, data: "not json" })).status()).toBe(
    415,
  );
  expect(
    (
      await request.post("/api/sessions/start", {
        headers,
        data: { gameId: result.gameId, level: 1, padding: "x".repeat(5000) },
      })
    ).status(),
  ).toBe(413);
  for (const data of [
    { gameId: "missing", level: 1 },
    { gameId: result.gameId, level: 9 },
    { gameId: result.gameId, level: 1, childId: "other-child" },
  ])
    expect((await request.post("/api/sessions/start", { headers, data })).status()).toBe(400);
  const started = await request.post("/api/sessions/start", {
    headers,
    data: { gameId: result.gameId, level: 1 },
  });
  const { sessionId } = await started.json();
  for (const invalid of [
    { ...result, stars: 999 },
    { ...result, rounds: 999 },
    { ...result, corrections: 5 },
    { ...result, gameId: "continue-pattern" },
  ])
    expect(
      (
        await request.post("/api/sessions", { headers, data: { sessionId, result: invalid } })
      ).status(),
    ).toBe(400);
  const stranger = await playwright.request.newContext({ baseURL });
  try {
    await stranger.post("/api/demo-session", { headers });
    expect(
      (await stranger.post("/api/sessions", { headers, data: { sessionId, result } })).status(),
    ).toBe(404);
  } finally {
    await stranger.dispose();
  }
  expect(
    (
      await request.post("/api/sessions", {
        headers,
        data: { sessionId: "00000000-0000-4000-8000-000000000000", result },
      })
    ).status(),
  ).toBe(404);
  expect(
    (await request.post("/api/sessions", { headers, data: { sessionId, result } })).status(),
  ).toBe(200);
});

test("the saved run pays one third-game bonus and stopping abandons unfinished games", async ({
  request,
  baseURL,
  browser,
}) => {
  const headers = { origin: baseURL as string };
  const credentials = await newFamily(request, baseURL as string);
  for (let i = 0; i < 3; i++) {
    const started = await request.post("/api/sessions/start", {
      headers,
      data: { gameId: result.gameId, level: 1 },
    });
    const { sessionId } = await started.json();
    const finish = await request.post("/api/sessions", { headers, data: { sessionId, result } });
    expect(finish.status()).toBe(200);
    expect((await finish.json()).completion).toMatchObject({
      bonus: i === 2 ? 5 : 0,
      suggestBreak: i === 2,
    });
  }
  const other = await browser.newContext({ baseURL });
  try {
    expect(
      (await other.request.post("/api/auth/login", { headers, data: credentials })).status(),
    ).toBe(200);
    for (let i = 0; i < 3; i++) {
      const start = await other.request.post("/api/sessions/start", {
        headers,
        data: { gameId: result.gameId, level: 1 },
      });
      const finish = await other.request.post("/api/sessions", {
        headers,
        data: { sessionId: (await start.json()).sessionId, result },
      });
      expect(finish.status()).toBe(200);
      expect((await finish.json()).completion.bonus).toBe(0);
    }
  } finally {
    await other.close();
  }
  const pending = await request.post("/api/sessions/start", {
    headers,
    data: { gameId: result.gameId, level: 1 },
  });
  const { sessionId } = await pending.json();
  expect((await request.post("/api/sessions/stop", { headers })).status()).toBe(200);
  expect(
    (await request.post("/api/sessions", { headers, data: { sessionId, result } })).status(),
  ).toBe(409);
  const next = await request.post("/api/sessions/start", {
    headers,
    data: { gameId: "continue-pattern", level: 2 },
  });
  const saved = await request.post("/api/sessions", {
    headers,
    data: {
      sessionId: (await next.json()).sessionId,
      result: { ...result, gameId: "continue-pattern", level: 2, mistakes: 1, corrections: 1 },
    },
  });
  expect(saved.status()).toBe(200);
  const { completion } = await saved.json();
  const brain = Math.min(100, completion.before.stats.brain + 2);
  const gain = brain - completion.before.stats.brain;
  expect(completion).toMatchObject({
    earnedStars: 13,
    bonus: 0,
    gains: gain > 0 ? { brain: gain } : {},
    after: { stats: { brain }, streak: { inRow: 1, bonusGiven: true } },
  });
});
