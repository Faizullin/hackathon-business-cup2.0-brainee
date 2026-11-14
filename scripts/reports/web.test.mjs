// Ported from game-store-planning; local adaptations are documented in docs/reports/README.md.
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { validateCapture } from "./generate.mjs";
import { hasFfmpeg } from "./media.mjs";
import { parseArgs, resolvePlaywright, runCapture, runFlows, safeFilePart } from "./web.mjs";

test("web: parseArgs reads values, booleans and --no- flags", () => {
  const parsed = parseArgs([
    "--base",
    "http://localhost:3000",
    "--viewport",
    "both",
    "--no-pdf",
    "--settle",
    "2000",
    "--relogin",
  ]);
  assert.equal(parsed.base, "http://localhost:3000");
  assert.equal(parsed.viewport, "both");
  assert.equal(parsed.pdf, false);
  assert.equal(parsed.settle, "2000");
  assert.equal(parsed.relogin, true);
});

test("web: hyphenated flags reach the options runCapture reads", () => {
  assert.deepEqual(
    parseArgs([
      "--locale-id",
      "kk-KZ",
      "--storage-state",
      "state.json",
      "--login-script",
      "login.json",
      "--auth-probe",
      "/games",
      "--no-allow-failures",
    ]),
    {
      _: [],
      localeId: "kk-KZ",
      storageState: "state.json",
      loginScript: "login.json",
      authProbe: "/games",
      allowFailures: false,
    },
  );
});

test("web: safeFilePart handles non-ASCII, slashes and special characters", () => {
  assert.equal(safeFilePart("games/upload"), "games-upload");
  assert.equal(safeFilePart("Файлы 3"), "3");
  assert.equal(safeFilePart("---test---"), "test");
  assert.equal(safeFilePart(""), "shot");
});

test("web: resolves Playwright", () => {
  assert.ok(fs.existsSync(resolvePlaywright()));
});

test("web: captures a page, writes a manifest that passes validateCapture", async (t) => {
  const server = http.createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end('<!doctype html><title>Mock</title><div data-testid="ready">Loaded</div>');
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  const { port } = server.address();

  const out = fs.mkdtempSync(path.join(os.tmpdir(), "report-web-test-"));
  t.after(() => fs.rmSync(out, { recursive: true, force: true }));

  const worklist = [
    {
      route: "/games",
      shots: [
        {
          name: "store-grid",
          steps: [
            { waitFor: { target: '[data-testid="ready"]', state: "visible" } },
            {
              screenshot: { name: "store-grid", fullPage: true, note: "Grid" },
            },
          ],
        },
      ],
    },
  ];
  const script = path.join(out, "shots.json");
  fs.writeFileSync(script, JSON.stringify(worklist));

  const summary = await runCapture({
    base: `http://127.0.0.1:${port}`,
    script,
    out,
    viewport: "ipad,phone",
    public: true,
    pdf: false,
    settle: 100,
    title: "Test Report",
  });

  assert.equal(summary.failed, 0);
  assert.equal(summary.results.length, 2); // iPad + phone
  for (const file of [
    "manifest.json",
    "index.html",
    "games--store-grid__ipad__light.png",
    "games--store-grid__phone__light.png",
    "games--store-grid__ipad__light--store-grid.png",
  ])
    assert.ok(fs.existsSync(path.join(out, file)), file);

  const manifest = JSON.parse(fs.readFileSync(path.join(out, "manifest.json"), "utf8"));
  const { rows } = validateCapture(
    { id: "store", routePrefix: "/", viewports: ["ipad", "phone"] },
    worklist,
    manifest,
    out,
  );
  assert.equal(rows.length, 2);
});

/** A two-page site whose first page reports a bridge event, like the store's player does. */
async function site(t) {
  const pages = {
    "/": `<!doctype html><title>Home</title><h1>Home</h1><a href="/next">Next</a>
      <script>setTimeout(() => window.__reportBridge?.({ kind: "event", name: "hello", data: { n: 1 } }), 50)</script>`,
    "/next": `<!doctype html><title>Next</title><h1>Next</h1>
      <div id="box" style="position:absolute;left:20px;top:80px;width:60px;height:60px;background:teal"></div>
      <script>document.addEventListener("mouseup", (e) => (window.dropped = { x: e.clientX, y: e.clientY }))</script>`,
  };
  const server = http.createServer((request, response) => {
    const body = pages[request.url];
    response.writeHead(body ? 200 : 404, { "Content-Type": "text/html; charset=utf-8" });
    response.end(body ?? "missing");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "report-flows-test-"));
  t.after(() => fs.rmSync(out, { recursive: true, force: true }));
  return { base: `http://127.0.0.1:${server.address().port}`, out };
}

test("web: a flow records steps, checks, bridge events and code steps on its timeline", async (t) => {
  const { base, out } = await site(t);
  const calls = path.join(out, "calls.mjs");
  fs.writeFileSync(
    calls,
    'export async function nudge(page, run) { run.timeline.mark("nudged " + run.args.by) }\n',
  );
  const scenario = path.join(out, "scenario.json");
  fs.writeFileSync(
    scenario,
    JSON.stringify({
      flows: [
        {
          name: "walk",
          start: "/",
          steps: [
            { expect: { target: { by: "role", role: "heading", name: "Home" } } },
            { expect: { event: "hello", message: "The page says hello over the bridge" } },
            { click: { by: "role", role: "link", name: "Next" } },
            { expect: { url: "^/next$" } },
            { drag: { from: "#box", to: { x: 0.5, y: 0.5 } } },
            {
              expect: {
                eval: "window.dropped && window.dropped.x === 640",
                message: "The drop lands mid-screen",
              },
            },
            { goto: "/" },
            { call: "nudge", args: { by: 2 } },
            { mark: "Done" },
          ],
        },
        {
          name: "broken",
          start: "/",
          steps: [{ expect: { target: "#missing", timeout: 300 } }, { mark: "never" }],
        },
      ],
    }),
  );
  const video = hasFfmpeg();
  const results = await runFlows({
    base,
    script: scenario,
    out,
    calls,
    public: true,
    settle: 50,
    video,
    module: "demo",
  });
  const [walk, broken] = results;

  assert.equal(walk.status, "PASSED", JSON.stringify(walk.entries, null, 2));
  assert.deepEqual(walk.checks, { passed: 4, failed: 0 });
  const messages = walk.entries.map((entry) => `${entry.source}:${entry.message}`);
  for (const expected of [
    "bridge:hello",
    "step:goto /",
    "mark:nudged 2",
    "step:call nudge",
    "mark:Done",
  ])
    assert.ok(messages.includes(expected), expected);
  assert.deepEqual(walk.entries.find((entry) => entry.message === "hello").data, { n: 1 });
  assert.deepEqual(
    JSON.parse(fs.readFileSync(path.join(out, "walk/timeline.json"), "utf8")).checks,
    walk.checks,
  );
  if (video) {
    assert.equal(walk.media.video, "walk.mp4");
    assert.ok(fs.statSync(path.join(out, "walk/walk.mp4")).size > 0);
    assert.ok(fs.existsSync(path.join(out, "walk/walk.jpg")));
    assert.deepEqual(
      fs.readdirSync(path.join(out, "walk")).filter((file) => file.endsWith(".webm")),
      [],
    );
  }

  assert.equal(broken.status, "FAILED");
  assert.ok(broken.entries.some((entry) => entry.source === "check" && entry.level === "error"));
  assert.ok(
    !broken.entries.some((entry) => entry.message === "never"),
    "a failed check stops the flow",
  );
});

test("web: a signed-in flow keeps the session it signed in with, even with --relogin", async (t) => {
  const server = http.createServer((request, response) => {
    const signedIn = /(?:^|; )session=ok/.test(request.headers.cookie ?? "");
    if (request.url === "/en/login") {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return response.end(`<!doctype html><title>Login</title><input id="identifier"><input id="password" type="password">
        <button type="submit" onclick="document.cookie='session=ok; path=/'; location.href='/home'">Log in</button>`);
    }
    if (!signedIn) {
      response.writeHead(302, { Location: "/en/login" });
      return response.end();
    }
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end("<!doctype html><title>Home</title><h1>Private</h1>");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "report-signin-test-"));
  t.after(() => fs.rmSync(out, { recursive: true, force: true }));
  const scenario = path.join(out, "scenario.json");
  fs.writeFileSync(
    scenario,
    JSON.stringify({
      flows: [
        {
          name: "home",
          start: "/home",
          steps: [{ expect: { target: { by: "role", role: "heading", name: "Private" } } }],
        },
      ],
    }),
  );
  const [home] = await runFlows({
    base: `http://127.0.0.1:${server.address().port}`,
    script: scenario,
    out,
    email: "spec@example.com",
    password: "secret",
    relogin: true,
    storageState: path.join(out, "auth.json"),
    settle: 50,
  });
  assert.equal(home.status, "PASSED", JSON.stringify(home.entries, null, 2));
});
