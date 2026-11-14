// Ported from game-store-planning; local adaptations are documented in docs/reports/README.md.
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { formatTime } from "./timeline.mjs";

// Markdown has no required formatter in this repo; keep Prettier optional.
const { format } = await import("prettier").catch(() => ({ format: async (text) => text }));

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

function containedFile(directory, file) {
  const target = path.resolve(directory, file);
  const relative = path.relative(realpathSync(directory), realpathSync(target));
  if (relative.startsWith("..") || path.isAbsolute(relative))
    throw new Error(`File is outside its capture/static directory: ${file}`);
  return target;
}

/** Web shots are taken at desktop and phone size; a device module names its own (e.g. `["mobile"]`). */
const viewportsOf = (module) => module.viewports ?? ["desktop", "mobile"];

export function validateCapture(module, worklist, manifest, capture) {
  const viewports = viewportsOf(module);
  const rows = manifest.results;
  if (!Array.isArray(rows) || !rows.length) throw new Error("Capture has no results");
  const expected = new Map();
  for (const entry of worklist)
    for (const shot of entry.shots) {
      if (expected.has(shot.name)) throw new Error(`Duplicate scenario: ${shot.name}`);
      expected.set(shot.name, { ...shot, baseline: entry.baseline });
    }
  const issues = [],
    cancellations = [];
  // Requests the app cancels by design: RSC prefetches, plus the module's own patterns.
  const cancelled = [
    /_rsc=/,
    ...(module.knownCancellations ?? []).map((pattern) => new RegExp(pattern)),
  ];
  for (const viewport of viewports)
    for (const name of expected.keys()) {
      if (
        rows.filter(
          (row) => row.shot === name && row.viewport === viewport && row.theme === "light",
        ).length !== 1
      )
        issues.push(`${viewport}: missing or duplicate scenario ${name}`);
    }
  for (const row of rows) {
    const label = `${row.shot}/${row.viewport}`;
    const expectedShot = expected.get(row.shot);
    const route = row.route?.split(/[?#]/, 1)[0];
    const root = module.routePrefix.replace(/\/$/, "");
    const inScope =
      root === ""
        ? typeof route === "string" && route.startsWith("/")
        : route === root || route?.startsWith(`${root}/`);
    // Baseline shots (legacy screens for comparison) may live outside the prefix.
    if (!expectedShot || !(inScope || expectedShot.baseline))
      issues.push(`${label}: outside ${module.id} worklist`);
    if (!viewports.includes(row.viewport) || row.theme !== "light")
      issues.push(`${label}: unexpected viewport/theme`);
    if (row.status !== 200 || row.error || row.redirectedToLogin)
      issues.push(`${label}: navigation failed`);
    for (const key of ["consoleErrors", "pageErrors", "httpErrors", "failedRequests"]) {
      for (const issue of row[key] ?? []) {
        if (
          key === "failedRequests" &&
          issue.startsWith("net::ERR_ABORTED ") &&
          cancelled.some((pattern) => pattern.test(issue))
        ) {
          cancellations.push(`${label}: ${issue}`);
        } else issues.push(`${label}: ${key}: ${issue}`);
      }
    }
    if ((row.steps ?? []).some((step) => !step.ok)) issues.push(`${label}: failed interaction`);
    for (const step of expectedShot?.steps ?? [])
      if (
        step.screenshot &&
        !(row.steps ?? []).some(
          (actual) =>
            actual.ok &&
            actual.label === step.screenshot.name &&
            actual.file &&
            existsSync(path.join(capture, actual.file)),
        )
      )
        issues.push(`${label}: missing screenshot ${step.screenshot.name}`);
  }
  if (issues.length)
    throw new Error(`Report not generated: ${issues.join("\n")}\nInspect ${capture}/index.html`);
  return { rows, cancellations };
}

const FLOW_TABLE_LIMIT = 200;

/** A flow's timeline from `<flowsDir>/<name>/timeline.json`; a FAILED flow is never published. */
export function readFlow(flowsDir, moduleId, name) {
  const file = flowsDir && path.join(flowsDir, name, "timeline.json");
  if (!file || !existsSync(file))
    throw new Error(`No run of flow ${name}: pnpm report --module ${moduleId} --flow ${name}`);
  const flow = readJson(file);
  if (flow.status === "FAILED") {
    const failure = flow.entries.find((entry) => entry.level === "error");
    throw new Error(
      `Report not generated: flow ${name} FAILED (${failure?.source}: ${failure?.message}). See ${file}`,
    );
  }
  return flow;
}

/** A flow's section: its video (poster linked to the MP4), result line and timeline. */
export function renderFlow(flow, media) {
  const cell = (text) => String(text).replace(/\|/g, "\\|").replaceAll("\n", " ");
  const seconds = (flow.durationMs / 1000).toFixed(1);
  const checks = flow.checks.passed + flow.checks.failed;
  const when = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(flow.startedAt));
  const lines = [
    `**${cell(flow.title)}** (flow \`${flow.flow}\`): ${flow.status}, ${checks ? `${flow.checks.passed} of ${checks} checks passed` : "no checks"}, ${seconds} s, ${flow.viewport ?? flow.surface}. Recorded ${when} (America/New_York) against \`${flow.target}\`.`,
  ];
  if (flow.note) lines.push("", flow.note);
  lines.push(
    "",
    media
      ? `[![${cell(flow.title)}: click to play the recording](${media.poster ?? media.video})](${media.video})`
      : `_No recording in this run; record it with \`pnpm report --module ${flow.module} --flow ${flow.flow} --video\`._`,
  );
  const rows = flow.entries.slice(0, FLOW_TABLE_LIMIT).map((entry) => {
    const level = entry.level === "info" ? "" : ` (${entry.level})`;
    return `| ${formatTime(entry.t)} | ${entry.source}${level} | ${cell(entry.message)} |`;
  });
  if (flow.entries.length > FLOW_TABLE_LIMIT)
    rows.push(`| … | | ${flow.entries.length - FLOW_TABLE_LIMIT} more in the module's log |`);
  lines.push(
    "",
    `<details><summary>Timeline: ${flow.entries.length} entries</summary>`,
    "",
    "| Time | Source | Entry |",
    "| --- | --- | --- |",
    ...rows,
    "",
    "</details>",
  );
  return lines.join("\n");
}

/** Validate and format first; only this module's generated screenshots and videos are pruned. */
export async function generateReport({ root, module, capture, worklist, flowsDir = null }) {
  if (!/^[a-z][a-z0-9-]*$/.test(module.id) || module.id === "static")
    throw new Error(`Invalid or reserved report module: ${module.id}`);
  // Flows render from their own runs; shots need a complete capture.
  let manifest = { results: [], generatedAt: null };
  let rows = [],
    cancellations = [];
  if (worklist.length) {
    const manifestFile = path.join(capture, "manifest.json");
    if (!existsSync(manifestFile))
      throw new Error(`No shots capture at ${capture}: pnpm report --module ${module.id} --shots`);
    manifest = readJson(manifestFile);
    ({ rows, cancellations } = validateCapture(module, worklist, manifest, capture));
  }
  const viewports = viewportsOf(module);
  const shots = new Map();
  for (const row of rows) {
    shots.set(`${row.shot}@${row.viewport}`, {
      file: row.file,
      caption: row.note ?? row.shot,
    });
    for (const step of row.steps ?? [])
      if (step.file && step.ok)
        shots.set(`${step.label}@${row.viewport}`, {
          file: step.file,
          caption: step.note ?? step.label,
        });
  }
  const copies = new Map();
  const staticRoot = path.join(root, "docs/reports/screens/static");
  const useImage = (reference) => {
    if (reference.startsWith("static:")) {
      const id = reference.slice(7);
      const asset = module.staticAssets[id];
      if (!asset) throw new Error(`Unknown static reference: ${id}`);
      const source = containedFile(staticRoot, asset.file);
      if (createHash("sha256").update(readFileSync(source)).digest("hex") !== asset.sha256)
        throw new Error(
          `Imported screenshot changed: ${asset.file}. Restore the original; generation never edits static assets.`,
        );
      return { src: `screens/static/${asset.file}`, caption: asset.caption };
    }
    const match = /^([a-z0-9-]+)(?:@([a-z]+))?$/.exec(reference);
    if (!match || (match[2] && !viewports.includes(match[2])))
      throw new Error(`Invalid screenshot reference: ${reference}`);
    const [, id, viewport = viewports[0]] = match;
    const shot = shots.get(`${id}@${viewport}`);
    if (!shot?.file) throw new Error(`Missing required screenshot: ${reference}`);
    const source = containedFile(capture, shot.file);
    const name = `${id}${viewport === viewports[0] ? "" : `-${viewport}`}.png`;
    copies.set(name, source);
    return { src: `screens/${module.id}/${name}`, caption: shot.caption };
  };
  const cell = (text) => text.replace(/\|/g, "\\|").replaceAll("\n", " ");
  const image = (item) => `![${cell(item.caption)}](${item.src})`;
  const template = path.join(root, `docs/reports/src/${module.id}.md`);
  let body = readFileSync(template, "utf8")
    .replace(/\{\{compare:([^}]+)\}\}/g, (_, spec) => {
      const columns = spec.split("|").map((column) => {
        const match = /^([^=]+)=(.+)$/.exec(column.trim());
        if (!match) throw new Error(`Invalid comparison column: ${column}`);
        return { label: match[1].trim(), ...useImage(match[2].trim()) };
      });
      if (columns.length < 2) throw new Error("Comparison needs at least two columns");
      const row = (cells) => `| ${cells.join(" | ")} |`;
      return [
        row(columns.map((c) => cell(c.label))),
        row(columns.map(() => "---")),
        row(columns.map(image)),
        row(columns.map((c) => `_${cell(c.caption)}_`)),
      ].join("\n");
    })
    .replace(/\{\{shot:([^}]+)\}\}/g, (_, reference) => image(useImage(reference)))
    .replace(/\{\{static:([^}]+)\}\}/g, (_, id) => image(useImage(`static:${id}`)));
  const flows = [];
  const videoCopies = new Map();
  body = body.replace(/\{\{flow:([a-z0-9-]+)\}\}/g, (_, name) => {
    const flow = readFlow(flowsDir, module.id, name);
    flows.push(flow);
    let media = null;
    if (flow.media?.video) {
      const source = path.join(flowsDir, name);
      videoCopies.set(`${name}.mp4`, containedFile(source, flow.media.video));
      if (flow.media.poster)
        videoCopies.set(`${name}.jpg`, containedFile(source, flow.media.poster));
      media = {
        video: `videos/${module.id}/${name}.mp4`,
        poster: flow.media.poster ? `videos/${module.id}/${name}.jpg` : null,
      };
    }
    return renderFlow(flow, media);
  });
  const sourceFile = capture && path.join(capture, "source.json");
  const source = rows.length && existsSync(sourceFile) ? readJson(sourceFile) : null;
  if (source?.module && source.module !== module.id)
    throw new Error(`Capture belongs to ${source.module}, not ${module.id}`);
  const verification = [];
  if (rows.length) {
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(manifest.generatedAt));
    const commit = source
      ? ` Source: \`${source.commit}\`${source.dirty ? " with working-tree changes" : ""}.`
      : "";
    verification.push(
      module.surface === "device"
        ? `Captured ${date} (America/New_York): ${rows.length} screens, taken by hand on a booted simulator or device.${commit}`
        : `Captured ${date} (America/New_York): ${rows.length} scenarios, ${viewports.join(" and ")}; ${module.localeLabel ?? "English"}, light theme. No failed steps, redirects, JavaScript errors, HTTP errors or unexpected failed requests. ${cancellations.length} known lifecycle request cancellations remain in the manifest.${commit} Imported static references are not live captures.`,
    );
  }
  if (flows.length)
    verification.push(
      `Flows: ${flows.map((flow) => `\`${flow.flow}\` ${flow.status} (${flow.checks.passed} checks)`).join(", ")}. Timelines: [JSON log](logs/${module.id}.json).`,
    );
  body = body.replace("{{verification}}", verification.join(" "));
  if (/\{\{[^}]+\}\}/.test(body)) throw new Error("Unresolved report placeholder");
  const markdown = await format(
    `<!-- Generated by pnpm report --module ${module.id}. Edit docs/reports/src/${module.id}.md. -->\n\n${body}`,
    { parser: "markdown" },
  );
  const screens = path.join(root, `docs/reports/screens/${module.id}`);
  const videos = path.join(root, `docs/reports/videos/${module.id}`);
  const logs = path.join(root, "docs/reports/logs");
  const output = path.join(root, `docs/reports/${module.id}.md`);
  syncDirectory(screens, copies, (name) => name.endsWith(".png"));
  syncDirectory(videos, videoCopies, (name) => /\.(mp4|jpg)$/.test(name));
  const logFile = path.join(logs, `${module.id}.json`);
  if (flows.length) {
    mkdirSync(logs, { recursive: true });
    writeFileSync(logFile, `${JSON.stringify({ module: module.id, flows }, null, 2)}\n`);
  } else if (existsSync(logFile)) unlinkSync(logFile);
  writeFileSync(`${output}.tmp`, markdown);
  renameSync(`${output}.tmp`, output);
  return {
    output,
    completed: rows.length + flows.length,
    cancellations: cancellations.length,
    flows: flows.length,
  };
}

/** Copies `files` (name → source) into `directory` and removes the other generated files there. */
function syncDirectory(directory, files, generated) {
  if (!files.size && !existsSync(directory)) return;
  mkdirSync(directory, { recursive: true });
  for (const [name, source] of files) copyFileSync(source, path.join(directory, name));
  for (const file of readdirSync(directory, { withFileTypes: true }))
    if (file.isFile() && generated(file.name) && !files.has(file.name))
      unlinkSync(path.join(directory, file.name));
}
