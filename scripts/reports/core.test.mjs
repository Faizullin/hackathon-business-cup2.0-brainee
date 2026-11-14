// Ported from game-store-planning; local adaptations are documented in docs/reports/README.md.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { generateReport, renderFlow, validateCapture } from "./generate.mjs";
import { modules, reportModule, resolveWorklist } from "./modules.mjs";
import { createTimeline, formatTime, timelineStatus } from "./timeline.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("timeline: times entries from the flow's start", () => {
  let now = 1_000;
  const timeline = createTimeline({
    app: "demo",
    module: "demo",
    flow: "f",
    surface: "web",
    target: "/",
    now: () => now,
  });
  now += 1_250;
  timeline.step("click Play");
  assert.equal(timeline.entries[0].t, 1_250);
  assert.equal(formatTime(61_005), "01:01.005");
  assert.throws(() => timeline.add("nowhere", "info", "x"), /Unknown timeline source/);
});

test("timeline: PASSED needs a check; any error fails; nothing checked is CAPTURED", () => {
  const status = (...entries) => timelineStatus(entries);
  assert.equal(status({ source: "step", level: "info" }), "CAPTURED");
  assert.equal(
    status({ source: "step", level: "info" }, { source: "check", level: "info" }),
    "PASSED",
  );
  assert.equal(
    status({ source: "check", level: "info" }, { source: "page", level: "error" }),
    "FAILED",
  );
  assert.equal(status({ source: "network", level: "warn" }), "CAPTURED");

  const timeline = createTimeline({
    app: "demo",
    module: "demo",
    flow: "f",
    surface: "web",
    target: "/",
  });
  assert.equal(timeline.check(false, "Saved"), false);
  const result = timeline.result();
  assert.equal(result.status, "FAILED");
  assert.deepEqual(result.checks, { passed: 0, failed: 1 });
  assert.equal(result.entries[0].message, "Check failed: Saved");
});

/** A throwaway repo with one module, `demo`, its capture, a flow run and a previous report. */
function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), "report-generate-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (file, content) => {
    const target = path.join(root, file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, content);
  };
  const get = (file) => readFileSync(path.join(root, file), "utf8");
  const original = "unchanged imported JPEG bytes";
  const demo = {
    id: "demo",
    title: "Demo",
    routePrefix: "/en/demo/",
    fixtures: { childId: { env: "DEMO_CHILD_ID" } },
    knownCancellations: ["/api/v2/subscriptions/me/$"],
    staticAssets: {
      legacy: {
        file: "phone.jpg",
        caption: "Legacy phone | original",
        sha256: createHash("sha256").update(original).digest("hex"),
      },
    },
  };
  const worklist = [
    {
      route: "/en/demo/children/1",
      shots: [{ name: "form", steps: [{ screenshot: { name: "questions" } }] }],
    },
  ];
  const manifest = {
    generatedAt: "2026-10-21T12:00:00.000Z",
    results: ["desktop", "mobile"].map((viewport) => ({
      route: "/en/demo/children/1",
      shot: "form",
      viewport,
      theme: "light",
      status: 200,
      file: `${viewport}.png`,
      steps: [
        { ok: true, label: "questions", file: `${viewport}.png`, note: `${viewport} questions` },
      ],
      consoleErrors: [],
      pageErrors: [],
      httpErrors: [],
      failedRequests: [],
    })),
  };
  const flush = () => put("capture/manifest.json", JSON.stringify(manifest));
  flush();
  put("capture/desktop.png", "desktop image");
  put("capture/mobile.png", "mobile image");
  put("capture/source.json", JSON.stringify({ module: "demo", commit: "abcdef", dirty: true }));
  put("docs/reports/screens/static/phone.jpg", original);
  put("docs/reports/screens/other/keep.png", "other module");
  put("docs/reports/screens/demo/stale.png", "obsolete");
  put("docs/reports/screens/demo/nested/keep.png", "nested artifact");
  put("docs/reports/screens/demo/README.md", "keep notes");
  put("docs/reports/videos/demo/gone.mp4", "obsolete video");
  put("docs/reports/demo.md", "last successful report");
  const template = (...parts) => put("docs/reports/src/demo.md", parts.join("\n\n"));
  template(
    "# Demo",
    "{{compare:Legacy phone=static:legacy|Current phone=questions@mobile}}",
    "{{shot:questions}}",
    "{{verification}}",
  );
  const flow = (status) => ({
    app: "demo",
    module: "demo",
    flow: "play",
    title: "Play a game",
    surface: "web",
    target: "http://localhost:3123/games",
    startedAt: "2026-11-04T10:00:00.000Z",
    durationMs: 4_200,
    status,
    checks: { passed: 1, failed: status === "FAILED" ? 1 : 0 },
    viewport: "desktop",
    media: { video: "play.mp4", poster: "play.jpg" },
    entries: [
      { t: 120, source: "step", level: "info", message: "open /games" },
      { t: 900, source: "bridge", level: "info", message: "puzzle_completed" },
      {
        t: 950,
        source: "check",
        level: status === "FAILED" ? "error" : "info",
        message: "Saved | done",
      },
    ],
  });
  const putFlow = (data) => {
    put("flows/play/timeline.json", JSON.stringify(data));
    put("flows/play/play.mp4", "video bytes");
    put("flows/play/play.jpg", "poster bytes");
  };
  const capture = path.join(root, "capture");
  const generate = () =>
    generateReport({ root, module: demo, worklist, capture, flowsDir: path.join(root, "flows") });
  const validate = () => validateCapture(demo, worklist, manifest, capture);
  const unchanged = () => {
    assert.equal(get("docs/reports/demo.md"), "last successful report");
    assert.equal(get("docs/reports/screens/demo/stale.png"), "obsolete");
    assert.equal(get("docs/reports/screens/other/keep.png"), "other module");
    assert.equal(existsSync(path.join(root, "docs/reports/screens/demo/questions.png")), false);
  };
  return {
    root,
    module: demo,
    worklist,
    manifest,
    put,
    get,
    flush,
    template,
    flow,
    putFlow,
    generate,
    validate,
    unchanged,
    original,
  };
}

test("modules: unknown or reserved ids, unknown placeholders and unsafe fixture ids are rejected", (t) => {
  for (const id of ["static", "../demo", "toString", "missing"])
    assert.throws(() => reportModule(id), /Unknown report module/);
  const { module: demo } = fixture(t);
  assert.equal(
    resolveWorklist(demo, [{ route: "/c/{{childId}}" }], { DEMO_CHILD_ID: "171" })[0].route,
    "/c/171",
  );
  assert.throws(() => resolveWorklist(demo, ["{{missing}}"], {}), /Unknown demo fixture/);
  for (const value of ["0", "-1", '1"/other', "1.5", ""])
    assert.throws(
      () => resolveWorklist(demo, ["{{childId}}"], { DEMO_CHILD_ID: value }),
      /positive fixture ID/,
    );
});

test("generateReport: comparisons keep imported originals; only generated files are pruned", async (t) => {
  const f = fixture(t);
  const result = await f.generate();
  const report = f.get("docs/reports/demo.md");
  assert.equal(result.completed, 2);
  assert.match(report, /Legacy phone/);
  assert.match(report, /screens\/static\/phone.jpg/);
  assert.match(report, /screens\/demo\/questions-mobile.png/);
  assert.match(report, /screens\/demo\/questions.png/);
  assert.match(report, /2 scenarios, desktop and mobile/);
  assert.equal(f.get("docs/reports/screens/demo/questions-mobile.png"), "mobile image");
  assert.equal(f.get("docs/reports/screens/static/phone.jpg"), f.original);
  assert.equal(f.get("docs/reports/screens/other/keep.png"), "other module");
  assert.equal(f.get("docs/reports/screens/demo/nested/keep.png"), "nested artifact");
  assert.equal(f.get("docs/reports/screens/demo/README.md"), "keep notes");
  assert.equal(existsSync(path.join(f.root, "docs/reports/screens/demo/stale.png")), false);
});

test("generateReport: a flow renders its recording and timeline; stale videos go", async (t) => {
  const f = fixture(t);
  f.template("# Demo", "{{shot:questions}}", "{{flow:play}}", "{{verification}}");
  f.putFlow(f.flow("PASSED"));
  const result = await f.generate();
  const report = f.get("docs/reports/demo.md");
  assert.equal(result.completed, 3);
  assert.equal(result.flows, 1);
  assert.match(
    report,
    /\[!\[Play a game: click to play the recording\]\(videos\/demo\/play\.jpg\)\]\(videos\/demo\/play\.mp4\)/,
  );
  assert.match(report, /Saved \\\| done/);
  assert.match(report, /`play` PASSED \(1 checks\)/);
  assert.equal(f.get("docs/reports/videos/demo/play.mp4"), "video bytes");
  assert.equal(existsSync(path.join(f.root, "docs/reports/videos/demo/gone.mp4")), false);
  assert.equal(JSON.parse(f.get("docs/reports/logs/demo.json")).flows[0].flow, "play");
});

test("generateReport: a FAILED or missing flow never overwrites the report", async (t) => {
  const f = fixture(t);
  f.template("# Demo", "{{shot:questions}}", "{{flow:play}}");
  await assert.rejects(f.generate(), /No run of flow play/);
  f.putFlow(f.flow("FAILED"));
  await assert.rejects(f.generate(), /flow play FAILED/);
  f.unchanged();
});

test("renderFlow: says when a flow was run without a recording", () => {
  const timeline = createTimeline({
    app: "demo",
    module: "demo",
    flow: "f",
    surface: "web",
    target: "/",
  });
  timeline.step("open /");
  const text = renderFlow(timeline.result(), null);
  assert.match(text, /CAPTURED, no checks/);
  assert.match(text, /No recording in this run/);
});

test("validation: any page error leaves the previous report and images intact", async (t) => {
  for (const type of ["consoleErrors", "pageErrors", "httpErrors", "failedRequests"]) {
    await t.test(type, async (t) => {
      const f = fixture(t);
      f.manifest.results[0][type].push("unexpected error");
      f.flush();
      await assert.rejects(f.generate, /Report not generated/);
      f.unchanged();
    });
  }
});

test("validation: a device module's shots are one viewport, named without a suffix", async (t) => {
  const f = fixture(t);
  f.module.viewports = ["mobile"];
  f.manifest.results.shift();
  f.flush();
  f.template("# Demo", "{{shot:questions}}", "{{verification}}");
  await f.generate();
  assert.match(f.get("docs/reports/demo.md"), /screens\/demo\/questions\.png/);
  assert.match(f.get("docs/reports/demo.md"), /1 scenarios, mobile/);
  assert.equal(f.get("docs/reports/screens/demo/questions.png"), "mobile image");
  f.template("{{shot:questions@desktop}}");
  await assert.rejects(f.generate, /Invalid screenshot reference/);
});

test("validation: missing or duplicate viewports fail", async (t) => {
  const f = fixture(t);
  f.manifest.results.pop();
  f.flush();
  await assert.rejects(f.generate, /mobile: missing or duplicate/);
  f.manifest.results.push(f.manifest.results[0]);
  f.flush();
  await assert.rejects(f.generate, /desktop: missing or duplicate/);
  f.unchanged();
});

test("validation: failed steps, navigation and missing checkpoints block publication", async (t) => {
  const f = fixture(t);
  f.manifest.results[0].status = 500;
  f.manifest.results[0].steps[0].ok = false;
  f.flush();
  await assert.rejects(
    f.generate,
    /navigation failed[\s\S]*failed interaction[\s\S]*missing screenshot/,
  );
  f.unchanged();
});

test("validation: routes outside the module and extra scenarios are rejected; baselines may sit outside", async (t) => {
  const f = fixture(t);
  f.manifest.results.forEach((row) => {
    row.route = "/en/demo";
  });
  assert.equal(f.validate().rows.length, 2, "the prefix itself");
  f.manifest.results[0].route = "/en/demo?day=2026-10-22";
  assert.equal(f.validate().rows.length, 2, "with a query");
  f.manifest.results[0].route = "/en/demo-other";
  assert.throws(f.validate, /outside demo worklist/, "a similarly named sibling");
  f.worklist[0].baseline = true;
  f.manifest.results[0].route = "/en/legacy/editor";
  assert.equal(f.validate().rows.length, 2, "a baseline legacy screen");
  delete f.worklist[0].baseline;
  f.manifest.results.push({ ...f.manifest.results[1], shot: "extra" });
  f.flush();
  await assert.rejects(f.generate, /outside demo worklist/);
  f.unchanged();
});

test("validation: known cancellations are recorded without masking API failures", (t) => {
  const f = fixture(t);
  f.manifest.results[0].failedRequests.push(
    "net::ERR_ABORTED http://localhost:3000/profile?_rsc=x",
  );
  f.manifest.results[1].failedRequests.push(
    "net::ERR_ABORTED http://localhost:3000/api/v2/subscriptions/me/",
  );
  assert.equal(f.validate().cancellations.length, 2);
  f.manifest.results[1].failedRequests.push(
    "net::ERR_ABORTED http://localhost:3000/api/v2/surveys/access/",
  );
  assert.throws(f.validate, /surveys\/access/);
});

test("validation: edited imported images, missing images and unresolved placeholders do not publish", async (t) => {
  const f = fixture(t);
  f.put("docs/reports/screens/static/phone.jpg", "edited image");
  await assert.rejects(f.generate, /Imported screenshot changed/);
  f.put("docs/reports/screens/static/phone.jpg", f.original);
  f.template("{{shot:missing}}");
  await assert.rejects(f.generate, /Missing required screenshot/);
  f.template("{{unknown}}");
  await assert.rejects(f.generate, /Unresolved report placeholder/);
  f.unchanged();
});

test("validation: a missing checkpoint file cannot use stale output as evidence", async (t) => {
  const f = fixture(t);
  unlinkSync(path.join(f.root, "capture/mobile.png"));
  await assert.rejects(f.generate, /missing screenshot questions/);
  f.unchanged();
});

test("validation: another module's capture, a reserved id and escaping symlinks are rejected", async (t) => {
  const f = fixture(t);
  f.put("capture/source.json", JSON.stringify({ module: "other", commit: "abcdef" }));
  await assert.rejects(f.generate, /belongs to other/);
  f.put("capture/source.json", JSON.stringify({ module: "demo", commit: "abcdef" }));
  f.module.id = "static";
  await assert.rejects(f.generate, /reserved report module/);
  f.module.id = "demo";
  unlinkSync(path.join(f.root, "capture/mobile.png"));
  symlinkSync(
    path.join(f.root, "docs/reports/screens/other/keep.png"),
    path.join(f.root, "capture/mobile.png"),
  );
  await assert.rejects(f.generate, /outside its capture\/static directory/);
  f.unchanged();
});

test("modules: registered scenarios parse and templates use only their flows", () => {
  for (const id of Object.keys(modules)) {
    const mod = reportModule(id);
    const env = Object.fromEntries(Object.values(mod.fixtures).map((spec) => [spec.env, "1"]));
    const scenario = resolveWorklist(
      mod,
      JSON.parse(readFileSync(path.join(repoRoot, mod.scenario), "utf8")),
      env,
    );
    const flows = new Set();
    for (const flow of scenario.flows ?? []) {
      assert.match(flow.name, /^[a-z0-9-]+$/, `${id}: flow name`);
      // A web flow lists its steps; a device flow names its integration test.
      assert.ok(
        (flow.start && Array.isArray(flow.steps)) || flow.test,
        `${id}/${flow.name}: steps or a test`,
      );
      assert.ok(!flows.has(flow.name), `${id}: duplicate flow ${flow.name}`);
      flows.add(flow.name);
    }
    const template = path.join(repoRoot, `docs/reports/src/${id}.md`);
    if (!existsSync(template)) continue;
    for (const [, name] of readFileSync(template, "utf8").matchAll(/\{\{flow:([^}]+)\}\}/g))
      assert.ok(flows.has(name), `${id}: template uses unknown flow ${name}`);
  }
});

test("reports: every relative link and image in docs/reports resolves", () => {
  const dir = path.join(repoRoot, "docs/reports");
  if (!existsSync(dir)) return;
  const missing = [];
  const walk = (folder) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "src") walk(file);
      else if (entry.isFile() && entry.name.endsWith(".md"))
        for (const [, link] of readFileSync(file, "utf8").matchAll(/\]\(([^)\s]+)\)/g)) {
          if (/^(?:[a-z]+:|#)/i.test(link)) continue;
          const target = decodeURIComponent(link.split("#")[0]);
          if (!existsSync(path.resolve(folder, target)))
            missing.push(`${path.relative(repoRoot, file)} → ${link}`);
        }
    }
  };
  walk(dir);
  assert.deepEqual(missing, []);
});
