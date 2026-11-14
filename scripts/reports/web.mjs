#!/usr/bin/env node
// biome-ignore-all lint/suspicious/noUndeclaredEnvVars: Standalone reports run outside Turborepo caching.
// Ported from game-store-planning; local adaptations are documented in docs/reports/README.md.
/**
 * The web surface of the reports (`pnpm report`), on Playwright:
 *
 * - shots: each shot loads its route fresh at desktop and phone size and
 *   writes screenshots, manifest.json, an HTML contact sheet and report.pdf;
 * - flows (`--flows`): one continuous session per flow through the app, with
 *   checks, an optional video and a timeline of steps, console, network and
 *   game-bridge traffic.
 *
 * Hyphenated flags (`--locale-id`, `--storage-state` …) map to option names.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transcodeVideo } from "./media.mjs";
import { bridgeEntry, createTimeline } from "./timeline.mjs";

// ── Resolve Playwright ────────────────────────────────────────────────────────
export function resolvePlaywright() {
  // Resolve the workspace's pinned dependency, never a global Playwright version.
  const require = createRequire(new URL("../../apps/web/package.json", import.meta.url));
  return require.resolve("@playwright/test");
}

// ── Parse CLI Args ────────────────────────────────────────────────────────────
/** `--locale-id` → `localeId`: the option names `runCapture` reads. */
const optionName = (flag) => flag.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

export function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith("--")) {
      const k = optionName(t.slice(2));
      if (/^no[A-Z]/.test(k)) {
        a[k.charAt(2).toLowerCase() + k.slice(3)] = false;
        continue;
      }
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        a[k] = true;
      } else {
        a[k] = next;
        i++;
      }
    } else {
      a._.push(t);
    }
  }
  return a;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function safeFilePart(value) {
  return (
    String(value)
      .normalize("NFKD")
      .replace(/[^a-z0-9_-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100) || "shot"
  );
}

export function targetLocator(page, target, { textFallback = false, visible = true } = {}) {
  let locator;
  if (typeof target === "string") {
    locator = textFallback
      ? page.getByText(target, { exact: false }).filter({ visible: true }).first()
      : page.locator(target);
  } else {
    if (!target || typeof target !== "object") {
      throw new Error("Locator target must be a string or object");
    }
    const exact = target.exact === undefined ? undefined : !!target.exact;
    switch (target.by) {
      case "css":
        locator = page.locator(String(target.value));
        break;
      case "text":
        locator = page.getByText(String(target.value), { exact });
        break;
      case "label":
        locator = page.getByLabel(String(target.value), { exact });
        break;
      case "testId":
        locator = page.getByTestId(String(target.value));
        break;
      case "role": {
        const role = String(target.role ?? target.value);
        locator = page.getByRole(
          role,
          target.name ? { name: String(target.name), exact } : undefined,
        );
        break;
      }
      default:
        throw new Error(`Unknown locator strategy: ${target.by}`);
    }
  }
  return (visible ? locator.filter({ visible: true }) : locator).first();
}

export async function settle(page, settleMs = 1500) {
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  // Loading skeletons, not small status dots that pulse for good.
  await page
    .waitForFunction(
      () =>
        ![
          ...document.querySelectorAll('.animate-pulse,[data-loading="true"],[aria-busy="true"]'),
        ].some((el) => {
          const { width, height } = el.getBoundingClientRect();
          return width * height > 100;
        }),
      null,
      { timeout: 8000 },
    )
    .catch(() => {});
  await page.waitForTimeout(settleMs);
}

const firstLine = (error) =>
  String(error?.message ?? error)
    .split("\n")[0]
    .slice(0, 300);
const describe = (target) => (typeof target === "string" ? target : JSON.stringify(target));

/** Polls `condition` until it holds or `timeout` ms pass. */
async function waitUntil(condition, timeout, what) {
  const deadline = Date.now() + timeout;
  for (;;) {
    if (await condition()) return;
    if (Date.now() > deadline) throw new Error(`Timed out after ${timeout}ms waiting for ${what}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/** The page's frame whose URL contains `part` (a game's iframe), or the page itself. */
export async function frameOf(page, part, timeout = 15000) {
  if (!part) return page;
  let frame;
  await waitUntil(
    () => (frame = page.frames().find((f) => f.url().includes(part))),
    timeout,
    `a frame at ${part}`,
  );
  return frame;
}

/** A target's centre, or `{ x, y }` as fractions of the viewport; in page coordinates. */
async function pointOf(page, point, frame) {
  if (point && typeof point === "object" && typeof point.x === "number" && point.by === undefined) {
    const { width, height } = page.viewportSize();
    return { x: point.x * width, y: point.y * height };
  }
  const box = await targetLocator(await frameOf(page, frame), point).boundingBox();
  if (!box) throw new Error(`No box for ${describe(point)}`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** What an `expect` step checks, in words, when it doesn't say. */
const expectation = (config) =>
  config.message ??
  [
    config.target !== undefined && `${describe(config.target)} ${config.state ?? "visible"}`,
    config.text !== undefined && `text "${config.text}"`,
    config.url !== undefined && `URL ${config.url}`,
    config.event !== undefined && `bridge ${config.event}`,
    config.eval !== undefined && `eval ${config.eval}`,
  ]
    .filter(Boolean)
    .join(", ");

async function checkExpectation(page, config, context) {
  const timeout = Number(config.timeout ?? 15000);
  const scope = await frameOf(page, config.frame, timeout);
  if (config.target !== undefined) {
    const locator = targetLocator(scope, config.target, {
      visible: !["hidden", "detached"].includes(config.state),
    });
    await locator.waitFor({ state: config.state ?? "visible", timeout });
    if (config.text !== undefined) {
      await waitUntil(
        async () => (await locator.textContent())?.includes(config.text),
        timeout,
        `text "${config.text}"`,
      );
    }
  } else if (config.text !== undefined) {
    await targetLocator(scope, config.text, { textFallback: true }).waitFor({ timeout });
  }
  if (config.url !== undefined) {
    const pattern = new RegExp(config.url);
    await waitUntil(
      () => {
        const url = new URL(page.url());
        return pattern.test(url.pathname + url.search);
      },
      timeout,
      `URL ${config.url}`,
    );
  }
  if (config.event !== undefined) {
    if (!context.timeline) throw new Error("Bridge events are only seen in flows");
    await waitUntil(
      () =>
        context.timeline.entries.some(
          (entry) => entry.source === "bridge" && entry.message === config.event,
        ),
      timeout,
      `bridge ${config.event}`,
    );
  }
  if (config.eval !== undefined) await scope.waitForFunction(config.eval, null, { timeout });
}

export async function runSteps(page, steps, artifact = {}, context = {}) {
  const log = [];
  // Flows also put every step, check and mark on their timeline.
  const record = (entry) => {
    log.push(entry);
    const { timeline } = context;
    if (!timeline) return;
    if (entry.check) timeline.check(entry.ok, entry.message, entry.error && { error: entry.error });
    else if (entry.mark) timeline.mark(entry.step);
    else timeline.step(entry.ok ? entry.step : `${entry.step}: ${entry.error}`, entry.ok);
  };
  for (const [stepIndex, step] of steps.entries()) {
    try {
      if (step.goto !== undefined) {
        if (!context.base) throw new Error("goto needs a base URL");
        const response = await page.goto(context.base + step.goto, {
          waitUntil: "domcontentloaded",
          timeout: Number(step.timeout ?? 30000),
        });
        if ((response?.status() ?? 200) >= 400) throw new Error(`HTTP ${response.status()}`);
        await settle(page, context.settleMs ?? 1500);
        record({ step: `goto ${step.goto}`, ok: true });
      } else if (step.expect !== undefined) {
        const message = expectation(step.expect);
        let error = null;
        try {
          await checkExpectation(page, step.expect, context);
        } catch (e) {
          error = firstLine(e);
        }
        record({ step: `expect ${message}`, ok: !error, check: true, message, error });
        if (error && !step.continueOnError) break;
      } else if (step.drag !== undefined) {
        const { from, to, frame, steps: moves = 15 } = step.drag;
        const start = await pointOf(page, from, frame);
        const end = await pointOf(page, to, frame);
        await page.mouse.move(start.x, start.y);
        await page.mouse.down();
        await page.mouse.move(end.x, end.y, { steps: Number(moves) });
        await page.mouse.up();
        record({ step: `drag ${describe(from)} → ${describe(to)}`, ok: true });
      } else if (step.mark !== undefined) {
        record({ step: String(step.mark), ok: true, mark: true });
      } else if (step.call !== undefined) {
        const action = context.calls?.[step.call];
        if (typeof action !== "function") throw new Error(`No scenario function ${step.call}`);
        await action(page, {
          base: context.base,
          args: step.args ?? {},
          timeline: context.timeline,
          frameOf: (part, timeout) => frameOf(page, part, timeout),
        });
        record({ step: `call ${step.call}`, ok: true });
      } else if (step.click !== undefined) {
        await targetLocator(page, step.click, {
          textFallback: typeof step.click === "string",
        }).click({ timeout: Number(step.timeout ?? 10000) });
        record({
          step: `click ${typeof step.click === "string" ? step.click : JSON.stringify(step.click)}`,
          ok: true,
        });
      } else if (step.clickSel !== undefined) {
        await targetLocator(page, step.clickSel).click({
          timeout: Number(step.timeout ?? 10000),
        });
        record({ step: `clickSel ${step.clickSel}`, ok: true });
      } else if (step.fill !== undefined) {
        const legacy = Array.isArray(step.fill);
        const target = legacy ? step.fill[0] : step.fill.target;
        const envName = legacy ? null : step.fill.env;
        const value = envName
          ? (context.env?.[envName] ??
            process.env[envName] ??
            (envName === "UISHOT_EMAIL" ? context.email : null) ??
            (envName === "UISHOT_PASSWORD" ? context.password : null))
          : legacy
            ? step.fill[1]
            : step.fill.value;
        if (value === undefined || value === null) {
          throw new Error(`Fill value is missing${envName ? `: env ${envName}` : ""}`);
        }
        await targetLocator(page, target).fill(String(value), {
          timeout: Number(step.timeout ?? 10000),
        });
        const secret = !legacy && (step.fill.secret || envName?.includes("PASSWORD"));
        record({
          step: `fill ${typeof target === "string" ? target : JSON.stringify(target)}${secret ? " [redacted]" : ""}`,
          ok: true,
        });
      } else if (step.press !== undefined) {
        if (typeof step.press === "string") {
          await page.keyboard.press(step.press);
        } else {
          await targetLocator(page, step.press.target).press(String(step.press.key), {
            delay: step.press.delay,
          });
        }
        record({
          step: `press ${typeof step.press === "string" ? step.press : step.press.key}`,
          ok: true,
        });
      } else if (step.scroll !== undefined) {
        const legacy = Array.isArray(step.scroll);
        const target = legacy ? step.scroll[0] : step.scroll.target;
        const x = Number(legacy ? 0 : (step.scroll.x ?? 0));
        const y = Number(legacy ? step.scroll[1] : (step.scroll.y ?? 0));
        let moved;
        if (target) {
          moved = await targetLocator(page, target).evaluate(
            (el, delta) => {
              const before = { x: el.scrollLeft, y: el.scrollTop };
              el.scrollBy(delta.x, delta.y);
              return { x: el.scrollLeft - before.x, y: el.scrollTop - before.y };
            },
            { x, y },
          );
        } else {
          moved = await page.evaluate(
            (delta) => {
              const before = { x: window.scrollX, y: window.scrollY };
              window.scrollBy(delta.x, delta.y);
              return {
                x: window.scrollX - before.x,
                y: window.scrollY - before.y,
              };
            },
            { x, y },
          );
        }
        record({
          step: `scroll ${target ? JSON.stringify(target) : "window"} by ${x},${y}`,
          ok: true,
          moved,
        });
      } else if (step.move !== undefined) {
        await page.mouse.move(step.move[0], step.move[1]);
        record({ step: `move ${step.move.join(",")}`, ok: true });
      } else if (step.wait !== undefined) {
        await page.waitForTimeout(Number(step.wait));
        record({ step: `wait ${step.wait}`, ok: true });
      } else if (step.waitFor !== undefined) {
        const config = typeof step.waitFor === "string" ? { target: step.waitFor } : step.waitFor;
        await targetLocator(page, config.target, {
          visible: !["hidden", "detached"].includes(config.state),
        }).waitFor({
          state: config.state ?? "visible",
          timeout: Number(config.timeout ?? 20000),
        });
        record({
          step: `waitFor ${JSON.stringify(config.target)} ${config.state ?? "visible"}`,
          ok: true,
        });
      } else if (step.hover !== undefined) {
        await targetLocator(page, step.hover).hover({
          timeout: Number(step.timeout ?? 10000),
        });
        record({ step: `hover ${JSON.stringify(step.hover)}`, ok: true });
      } else if (step.scrollIntoView !== undefined) {
        await targetLocator(page, step.scrollIntoView).scrollIntoViewIfNeeded({
          timeout: Number(step.timeout ?? 10000),
        });
        record({
          step: `scrollIntoView ${JSON.stringify(step.scrollIntoView)}`,
          ok: true,
        });
      } else if (step.select !== undefined) {
        await targetLocator(page, step.select.target).selectOption(step.select.value, {
          timeout: Number(step.timeout ?? 10000),
        });
        record({
          step: `select ${JSON.stringify(step.select.target)}`,
          ok: true,
        });
      } else if (step.check !== undefined) {
        const config =
          typeof step.check === "object" && step.check.target
            ? step.check
            : { target: step.check, checked: true };
        if (config.checked === false) {
          await targetLocator(page, config.target).uncheck({
            timeout: Number(step.timeout ?? 10000),
          });
        } else {
          await targetLocator(page, config.target).check({
            timeout: Number(step.timeout ?? 10000),
          });
        }
        record({
          step: `${config.checked === false ? "uncheck" : "check"} ${JSON.stringify(config.target)}`,
          ok: true,
        });
      } else if (step.screenshot !== undefined) {
        const config =
          typeof step.screenshot === "string" ? { name: step.screenshot } : step.screenshot;
        if (!artifact.out || !artifact.prefix) {
          throw new Error("screenshot step requires an artifact context");
        }
        const fileName = `${safeFilePart(artifact.prefix)}--${safeFilePart(config.name ?? `step-${stepIndex + 1}`)}.png`;
        const filePath = path.join(artifact.out, fileName);
        if (config.target) {
          await targetLocator(page, config.target).screenshot({
            path: filePath,
            animations: "disabled",
          });
        } else {
          await page.screenshot({
            path: filePath,
            fullPage: !!config.fullPage,
            animations: "disabled",
          });
        }
        record({
          step: `screenshot ${config.name ?? stepIndex + 1}`,
          ok: true,
          file: fileName,
          label: config.name ?? `Step ${stepIndex + 1}`,
          note: config.note ?? step.note ?? null,
        });
      } else if (step.captureScrollable !== undefined) {
        const config = step.captureScrollable;
        if (!artifact.out || !artifact.prefix) {
          throw new Error("captureScrollable requires an artifact context");
        }
        const locator = targetLocator(page, config.target);
        await locator.scrollIntoViewIfNeeded();
        const metrics = await locator.evaluate((el) => ({
          top: el.scrollTop,
          height: el.clientHeight,
          total: el.scrollHeight,
        }));
        const increment = Number(config.step ?? Math.max(1, Math.floor(metrics.height * 0.8)));
        const maxTop = Math.max(0, metrics.total - metrics.height);
        const maxSteps = Math.min(30, Math.max(1, Number(config.maxSteps ?? 12)));
        const files = [];
        try {
          for (let index = 0; index < maxSteps; index++) {
            const top = Math.min(index * increment, maxTop);
            await locator.evaluate((el, value) => {
              el.scrollTop = value;
            }, top);
            await page.waitForTimeout(100);
            const fileName = `${safeFilePart(artifact.prefix)}--${safeFilePart(config.name ?? "scrollable")}--${index + 1}.png`;
            await locator.screenshot({
              path: path.join(artifact.out, fileName),
              animations: "disabled",
            });
            files.push(fileName);
            if (top === maxTop) break;
          }
        } finally {
          await locator.evaluate((el, value) => {
            el.scrollTop = value;
          }, metrics.top);
        }
        const artifacts = files.map((file, index) => ({
          file,
          label: `${config.name ?? "Scrollable region"} ${index + 1}`,
          note: Array.isArray(config.notes)
            ? (config.notes[index] ?? null)
            : config.note
              ? `${config.note} — position ${index + 1}`
              : null,
        }));
        record({
          step: `captureScrollable ${JSON.stringify(config.target)}`,
          ok: true,
          files,
          artifacts,
        });
      } else {
        throw new Error(`Unknown step action: ${JSON.stringify(step)}`);
      }
    } catch (e) {
      record({
        step: JSON.stringify(step),
        ok: false,
        error: String(e.message).split("\n")[0].slice(0, 160),
      });
      if (!step.continueOnError) break;
    }
  }
  return log;
}

// ── Contact Sheet Generator ───────────────────────────────────────────────────
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

function reportArtifacts(result) {
  const checkpoints = [];
  for (const step of result.steps || []) {
    if (step.artifacts?.length) {
      checkpoints.push(...step.artifacts);
    } else if (step.file) {
      checkpoints.push({
        file: step.file,
        label: step.label ?? "Checkpoint",
        note: step.note ?? null,
      });
    } else {
      checkpoints.push(
        ...(step.files || []).map((file, index) => ({
          file,
          label: `${step.label ?? "Checkpoint"} ${index + 1}`,
          note: step.note ?? null,
        })),
      );
    }
  }
  const unique = [...new Map(checkpoints.map((artifact) => [artifact.file, artifact])).values()];
  const finalCapture = {
    file: result.file,
    label: result.shot === "default" ? "Page capture" : result.shot,
    note: result.note ?? null,
    final: true,
  };
  return unique.length && !result.reportFinal ? unique : [...unique, finalCapture];
}

function renderHtmlReport(summary) {
  const reportItems = summary.results.flatMap((result) =>
    reportArtifacts(result).map((artifact) => ({ result, artifact })),
  );
  summary.reportImages = reportItems.length;

  const cards = reportItems
    .map(({ result: r, artifact }) => {
      const issues = [
        r.error && `<li class="err">${esc(r.error)}</li>`,
        r.redirectedToLogin && '<li class="err">redirected to /login</li>',
        ...r.pageErrors.map((e) => `<li class="err">pageerror: ${esc(e)}</li>`),
        ...r.consoleErrors.slice(0, 3).map((e) => `<li class="warn">console: ${esc(e)}</li>`),
        ...r.failedRequests.slice(0, 3).map((e) => `<li class="warn">request: ${esc(e)}</li>`),
        ...r.httpErrors.slice(0, 3).map((e) => `<li class="warn">http: ${esc(e)}</li>`),
      ]
        .filter(Boolean)
        .join("");
      const cls = r.error || r.redirectedToLogin ? "bad" : issues ? "warn" : "ok";
      return `<article class="capture ${cls}">
  <header class="capture-header">
    <div><h2>${esc(artifact.label)}</h2><p class="route">${esc(r.route)}</p></div>
    <div class="capture-meta"><span>${esc(r.viewport)}</span><span>${esc(r.theme)}</span><span>HTTP ${r.status ?? "—"}</span><span>${r.ms}ms</span></div>
  </header>
  <button class="main-preview" type="button" data-preview="${esc(artifact.file)}" data-preview-title="${esc(`${artifact.label} — ${r.route}`)}" aria-label="Open ${esc(artifact.label)} screenshot">
    <img loading="lazy" src="${esc(artifact.file)}" alt="${esc(artifact.label)} at ${esc(r.viewport)} viewport">
  </button>
  <p class="image-note">${esc(artifact.note ?? `${artifact.label} at ${r.viewport} viewport.`)}</p>
  ${issues ? `<details class="issues" open><summary>Capture findings</summary><ul>${issues}</ul></details>` : ""}
</article>`;
    })
    .join("\n");

  const reportRoutes = [...new Set(summary.results.map((r) => r.route))];
  const reportViewports = [...new Set(summary.results.map((r) => r.viewport))];
  const reportThemes = [...new Set(summary.results.map((r) => r.theme))];

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(summary.title)}</title>
<style>
:root{color-scheme:light;--ink:#18212f;--muted:#657084;--line:#dce2ea;--panel:#fff;--page:#f4f6f8;--accent:#2563eb;--bad:#b42318;--warn:#9a6700}
*{box-sizing:border-box}
body{font:14px/1.55 ui-sans-serif,system-ui,sans-serif;margin:0;background:var(--page);color:var(--ink)}
.page{width:min(1180px,calc(100% - 32px));margin:28px auto 64px}
.report-header{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin-bottom:14px}
.eyebrow{margin:0 0 6px;color:var(--accent);font-size:11px;font-weight:750;letter-spacing:.12em;text-transform:uppercase}
h1{font-size:20px;line-height:1.2;margin:0}.facts{display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:10px;color:var(--muted);font-size:11px}.facts b{color:var(--ink)}
.stats{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.stat{padding:3px 7px;border-radius:999px;background:#eef2f7;font-size:11px}.stat.bad{background:#fee4e2;color:var(--bad)}.stat.good{background:#dcfae6;color:#067647}
.report-list{display:flex;flex-direction:column;gap:22px}
.capture{background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden}.capture.bad{border-color:#f04438}.capture.warn{border-color:#e9b949}
.capture-header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:17px 19px;border-bottom:1px solid var(--line)}
.capture-header h2{font-size:17px;margin:0;word-break:break-word}.capture-header .route{margin:3px 0 0;color:var(--muted);font-size:12px}
.capture-meta{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px}.capture-meta span{background:#f1f4f8;border-radius:6px;padding:4px 7px;color:#4b5668;font-size:11px;white-space:nowrap}
button{font:inherit}.main-preview,.checkpoint{border:0;background:none;padding:0;cursor:zoom-in;color:inherit}.main-preview{display:block;width:100%;background:#e8ecf1}.main-preview img{display:block;width:100%;height:auto;max-height:720px;object-fit:contain;object-position:top center;background:#fff}
.main-preview:focus-visible,.checkpoint:focus-visible{outline:3px solid #84adff;outline-offset:-3px}
.image-note{margin:0;padding:13px 18px;border-top:1px solid var(--line);color:#3c4758;white-space:pre-wrap}.issues{padding:14px 18px;border-top:1px solid var(--line)}.issues summary{cursor:pointer;font-weight:700}.issues ul{margin:9px 0 0;padding-left:20px}.issues .err{color:var(--bad)}.issues .warn{color:var(--warn)}
dialog{width:min(96vw,1500px);max-height:94vh;border:0;border-radius:12px;padding:0;background:#101318;color:#fff;box-shadow:0 24px 70px #0008}dialog::backdrop{background:#0b1020cc}.viewer-bar{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:10px 14px}.viewer-bar strong{font-size:13px}.viewer-bar button{border:1px solid #ffffff40;background:#ffffff12;color:#fff;border-radius:7px;padding:6px 10px;cursor:pointer}.viewer-image{display:block;max-width:94vw;max-height:84vh;margin:auto;object-fit:contain;background:#fff}
@media(max-width:650px){.page{width:min(100% - 18px,1180px);margin-top:9px}.report-header{padding:18px}.capture-header{display:block}.capture-meta{justify-content:flex-start;margin-top:10px}}
@media print{body{background:#fff}.page{width:100%;margin:0}.report-header,.capture{box-shadow:none}.capture{break-inside:avoid;margin-bottom:8mm}.main-preview img{max-height:155mm}.checkpoint-list{flex-wrap:wrap}.checkpoint{flex-basis:30%}dialog{display:none!important}}
</style>
</head><body><main class="page">
<header class="report-header">
  <p class="eyebrow">UI capture report</p>
  <h1>${esc(summary.title)}</h1>
  <div class="facts"><span><b>Base</b> ${esc(summary.base)}</span><span><b>Generated</b> ${esc(summary.generatedAt)}</span><span><b>Images</b> ${summary.reportImages}</span><span><b>Routes</b> ${reportRoutes.length}</span><span><b>Viewports</b> ${esc(reportViewports.join(", "))}</span><span><b>Themes</b> ${esc(reportThemes.join(", "))}</span></div>
  <div class="stats"><span class="stat ${summary.failed ? "bad" : "good"}">${summary.total} shots · ${summary.failed} failed</span><span class="stat ${summary.authRedirects ? "bad" : "good"}">${summary.authRedirects} auth redirects</span><span class="stat ${summary.withJsErrors ? "bad" : "good"}">${summary.withJsErrors} with JS errors</span><span class="stat ${summary.withFailedSteps ? "bad" : "good"}">${summary.withFailedSteps} with failed steps</span></div>
</header>
<section class="report-list" aria-label="Captured pages">${cards}</section>
</main>
<dialog id="image-viewer"><div class="viewer-bar"><strong id="viewer-title"></strong><button id="viewer-close" type="button">Close</button></div><img id="viewer-image" class="viewer-image" alt="Expanded screenshot"></dialog>
<script>
const viewer=document.querySelector('#image-viewer');
const viewerImage=document.querySelector('#viewer-image');
const viewerTitle=document.querySelector('#viewer-title');
document.addEventListener('click',(event)=>{const trigger=event.target.closest('[data-preview]');if(!trigger)return;viewerImage.src=trigger.dataset.preview;viewerTitle.textContent=trigger.dataset.previewTitle||'Screenshot';viewer.showModal();});
document.querySelector('#viewer-close').addEventListener('click',()=>viewer.close());
viewer.addEventListener('click',(event)=>{if(event.target===viewer)viewer.close();});
</script></body></html>`;
}

// ── Browser session (shots and flows) ─────────────────────────────────────────
const VIEWPORTS = {
  ipad: { name: "ipad", width: 1180, height: 820 },
  phone: { name: "phone", width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 },
  desktop: { name: "desktop", width: 1440, height: 900 },
  mobile: { name: "mobile", width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 },
};
/** Flows are recorded at video-friendly sizes. */
const FLOW_VIEWPORTS = {
  ipad: VIEWPORTS.ipad,
  phone: VIEWPORTS.phone,
  desktop: { name: "desktop", width: 1280, height: 720 },
  mobile: VIEWPORTS.mobile,
};

function viewportsFor(value, presets = VIEWPORTS) {
  const v = String(value || "both");
  if (v.includes(",")) return v.split(",").flatMap((name) => viewportsFor(name, presets));
  if (v === "both") return [presets.desktop, presets.mobile];
  if (presets[v]) return [presets[v]];
  const m = v.match(/^(\d+)x(\d+)$/);
  if (m) return [{ name: v, width: +m[1], height: +m[2] }];
  throw new Error(`Bad viewport option: ${v}`);
}

/**
 * Launches Chromium against `--base` (a local server: reports use disposable
 * fixtures) and signs in once per context unless `--public`; the session is
 * cached under ~/.uishots, keyed by base, account and locale.
 */
async function openSession(options) {
  const base = String(options.base || process.env.REPORT_BASE_URL || "").replace(/\/$/, "");
  if (!base) throw new Error("Set --base or REPORT_BASE_URL to the local app's URL");
  const outDir = path.resolve(String(options.out));
  const loginRoute = String(options.loginRoute || "/en/login");
  const loginScriptPath = options.loginScript ? path.resolve(String(options.loginScript)) : null;
  const authProbe = options.authProbe ? String(options.authProbe) : null;
  const locale = String(options.locale || "en");
  const browserLocale = String(options.localeId || "en-US");
  const localeCookie = String(options.localeCookie || "brainee_locale");
  const timezone = String(options.timezone || "America/New_York");
  const timeoutMs = Number(options.timeout ?? 30000);
  const email = options.email || process.env.REPORT_EMAIL || process.env.UISHOT_EMAIL;
  const password = options.password || process.env.REPORT_PASSWORD || process.env.UISHOT_PASSWORD;
  const storageState = options.storageState ? path.resolve(String(options.storageState)) : null;
  const relogin = !!options.relogin;
  const isPublic = !!options.public;

  fs.mkdirSync(outDir, { recursive: true });

  const pwPath = resolvePlaywright();
  const pw = await import(pathToFileURL(pwPath).href);
  const engine = String(options.browser || "chromium");
  if (!["chromium", "webkit"].includes(engine)) throw new Error("Unsupported report browser");
  const chromium = pw[engine] ?? pw.default?.[engine];
  if (!chromium) throw new Error("Could not load chromium from Playwright.");

  try {
    await fetch(base, { method: "HEAD", signal: AbortSignal.timeout(5000) });
  } catch (error) {
    const reason = error?.cause?.code || error?.message || String(error);
    console.error(`\nRunner: cannot reach --base ${base} (${reason})`);
    console.error("Make sure your frontend and backend servers are running.");
    process.exit(2);
  }

  const host = base.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-");
  const authIdentity = createHash("sha256")
    .update(`${base}\0${email ?? "anonymous"}\0${locale}`)
    .digest("hex")
    .slice(0, 12);
  const authFile =
    storageState ?? path.join(os.homedir(), ".uishots", `.auth-${host}-${authIdentity}.json`);

  const browser = await chromium.launch({
    headless: options.headed !== true,
    args: engine === "chromium" ? ["--no-sandbox", "--disable-dev-shm-usage"] : [],
  });

  /** `signedIn`: the caller has just signed in, so the saved session is fresh even with `--relogin`. */
  async function newContext(viewport, { theme = "light", recordVideo, signedIn = false } = {}) {
    const ctx = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: !!viewport.isMobile,
      hasTouch: !!viewport.isMobile,
      deviceScaleFactor: viewport.deviceScaleFactor || (viewport.isMobile ? 2 : 1),
      colorScheme: theme,
      locale: browserLocale,
      timezoneId: timezone,
      storageState:
        !isPublic && (signedIn || !relogin) && fs.existsSync(authFile) ? authFile : undefined,
      recordVideo,
    });
    await ctx.addInitScript((t) => {
      try {
        localStorage.setItem("theme", t);
      } catch {}
    }, theme);
    if (localeCookie) {
      await ctx.addCookies([{ name: localeCookie, value: locale, url: base, sameSite: "Strict" }]);
    }
    return ctx;
  }

  async function login(ctx) {
    const page = await ctx.newPage();
    await page.goto(`${base}${loginRoute}`, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    if (loginScriptPath && fs.existsSync(loginScriptPath)) {
      const loginSteps = JSON.parse(fs.readFileSync(loginScriptPath, "utf8"));
      const log = await runSteps(
        page,
        loginSteps,
        { prefix: "login", out: outDir },
        {
          email,
          password,
          env: { ...process.env, REPORT_EMAIL: email, REPORT_PASSWORD: password },
        },
      );
      const failed = log.find((entry) => !entry.ok);
      if (failed) throw new Error(`Login step failed: ${failed.step} — ${failed.error}`);
      await page.waitForURL((url) => url.pathname !== loginRoute, { timeout: timeoutMs });
    } else {
      if (!email || !password) throw new Error("Email and password required for login");
      await page.fill("#identifier", email);
      await page.fill("#password", password);
      await Promise.all([
        page.waitForURL((url) => url.pathname !== loginRoute, { timeout: timeoutMs }),
        page.click('button[type="submit"]'),
      ]);
    }
    await page.close();
    fs.mkdirSync(path.dirname(authFile), { recursive: true });
    await ctx.storageState({ path: authFile });
    try {
      fs.chmodSync(authFile, 0o600);
    } catch {}
  }

  /** Signs `ctx` in when the cached session is missing or stale (a probe lands on /login). */
  async function signIn(ctx, probeRoute) {
    if (isPublic) return;
    if (relogin || !fs.existsSync(authFile)) return login(ctx);
    const probe = await ctx.newPage();
    await probe
      .goto(base + (authProbe ?? probeRoute), { waitUntil: "domcontentloaded", timeout: timeoutMs })
      .catch(() => {});
    const stale = /\/login/.test(probe.url());
    await probe.close();
    if (stale) await login(ctx);
  }

  return {
    base,
    browser,
    outDir,
    isPublic,
    email,
    password,
    timeoutMs,
    settleMs: Number(options.settle ?? 1500),
    newContext,
    signIn,
  };
}

// ── Shots ─────────────────────────────────────────────────────────────────────
export async function runCapture(options = {}) {
  const repo = path.resolve(String(options.repo || process.cwd()));
  const scriptPath = path.resolve(String(options.script));
  const pdf = options.pdf !== false;
  const allowFailures = !!options.allowFailures;
  const reportTitle = String(options.title || "UI Capture Report");
  const viewports = viewportsFor(options.viewport);
  const themes = ["light"];
  const session = await openSession({
    ...options,
    out: options.out || path.join(repo, "docs/reports/.captures/latest"),
  });
  const { base, browser, outDir, isPublic, email, password, timeoutMs, settleMs } = session;

  try {
    // Load worklist
    const rawWorklist = JSON.parse(fs.readFileSync(scriptPath, "utf8"));
    const work = [];
    for (const entry of rawWorklist) {
      const shots = entry.shots?.length ? entry.shots : [{ name: "default" }];
      for (const sh of shots) {
        work.push({
          route: entry.route,
          name: sh.name || "default",
          steps: sh.steps || [],
          fullPage: sh.fullPage !== undefined ? sh.fullPage : entry.fullPage,
          note: sh.note ?? entry.note ?? null,
          reportFinal: sh.reportFinal ?? entry.reportFinal ?? false,
        });
      }
    }

    const results = [];

    for (const theme of themes) {
      for (const viewport of viewports) {
        const ctx = await session.newContext(viewport, { theme });
        await session.signIn(ctx, work[0].route);

        for (const item of work) {
          const { route, steps } = item;
          const slug =
            (route === "/" ? "root" : safeFilePart(route.replace(/^\//, "").replace(/\//g, "_"))) +
            (item.name && item.name !== "default" ? `--${item.name}` : "");
          const name = `${slug}__${viewport.name}__${theme}.png`;
          const file = path.join(outDir, name);

          const page = await ctx.newPage();
          const consoleErrors = [];
          const pageErrors = [];
          const failedRequests = [];
          const httpErrors = [];

          page.on("console", (m) => {
            if (m.type() === "error") consoleErrors.push(m.text().slice(0, 500));
          });
          page.on("pageerror", (e) => pageErrors.push(String(e.message).slice(0, 500)));
          page.on("request", (request) => {
            if (
              /^https?:/.test(request.url()) &&
              new URL(request.url()).origin !== new URL(base).origin
            )
              failedRequests.push(`Foreign-origin request: ${request.url()}`);
          });
          page.on("requestfailed", (r) => {
            // An open event stream is cut whenever the page navigates.
            if (r.resourceType() === "eventsource") return;
            const u = r.url();
            failedRequests.push(`${r.failure()?.errorText ?? "failed"} ${u.slice(0, 200)}`);
          });
          page.on("response", (response) => {
            if (response.status() >= 400) {
              httpErrors.push(
                `${response.status()} ${response.request().method()} ${response.url().slice(0, 240)}`,
              );
            }
          });

          const started = Date.now();
          let status = null;
          let error = null;
          let stepLog = [];

          try {
            const resp = await page.goto(base + route, {
              waitUntil: "domcontentloaded",
              timeout: timeoutMs,
            });
            status = resp?.status() ?? null;
            await settle(page, settleMs);

            if (steps.length) {
              stepLog = await runSteps(
                page,
                steps,
                { out: outDir, prefix: name.replace(/\.png$/, "") },
                { email, password, env: process.env },
              );
              await settle(page, settleMs);
            }

            const fp = item.fullPage === undefined ? true : !!item.fullPage;
            await page.screenshot({ path: file, fullPage: fp });
          } catch (e) {
            error = String(e.message).split("\n")[0].slice(0, 300);
            try {
              await page.screenshot({ path: file, fullPage: false });
            } catch {}
          }

          const finalUrl = page.url();
          const redirectedToLogin =
            !isPublic && !/\/login(?:[/?#]|$)/.test(route) && /\/login(?:[/?#]|$)/.test(finalUrl);

          let scrollables = [];
          try {
            scrollables = await page.evaluate(() =>
              [...document.querySelectorAll("body *")]
                .filter((el) => {
                  const overflow = getComputedStyle(el).overflowY;
                  return /(auto|scroll)/.test(overflow) && el.scrollHeight > el.clientHeight + 1;
                })
                .slice(0, 30)
                .map((el) => ({
                  tag: el.tagName.toLowerCase(),
                  id: el.id || null,
                  ariaLabel: el.getAttribute("aria-label"),
                  clientHeight: el.clientHeight,
                  scrollHeight: el.scrollHeight,
                })),
            );
          } catch {}

          await page.close();

          const rec = {
            route,
            shot: item.name,
            steps: stepLog,
            note: item.note,
            reportFinal: item.reportFinal,
            theme,
            viewport: viewport.name,
            file: name,
            status,
            ms: Date.now() - started,
            error,
            redirectedToLogin,
            consoleErrors,
            pageErrors,
            failedRequests,
            httpErrors,
            scrollables,
          };
          results.push(rec);

          const failedSteps = stepLog.filter((l) => !l.ok);
          const bad =
            error ||
            redirectedToLogin ||
            (status && status >= 400) ||
            pageErrors.length ||
            consoleErrors.length ||
            failedSteps.length;
          const mark = error ? "✗" : redirectedToLogin ? "⚠ login" : bad ? "⚠" : "✓";
          console.log(
            `${mark} ${String(status ?? "---").padEnd(3)} ${String(rec.ms).padStart(5)}ms  ${route}${item.name !== "default" ? ` [${item.name}]` : ""}  [${viewport.name}/${theme}]` +
              (failedSteps.length
                ? `\n     STEP FAILED: ${failedSteps[0].step} — ${failedSteps[0].error}`
                : "") +
              (error ? `\n     ${error}` : "") +
              (pageErrors.length ? `\n     pageerror: ${pageErrors[0]}` : "") +
              (consoleErrors.length ? `\n     console: ${consoleErrors[0]}` : "") +
              (httpErrors.length ? `\n     http: ${httpErrors[0]}` : ""),
          );
        }

        await ctx.close();
      }
    }

    // Summary & Manifest
    const summary = {
      title: reportTitle,
      note: null,
      base,
      generatedAt: new Date().toISOString(),
      total: results.length,
      failed: results.filter((r) => r.error).length,
      authRedirects: results.filter((r) => r.redirectedToLogin).length,
      withJsErrors: results.filter((r) => r.pageErrors.length || r.consoleErrors.length).length,
      withFailedSteps: results.filter((r) => (r.steps || []).some((s) => !s.ok)).length,
      results,
    };

    const html = renderHtmlReport(summary);
    fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(summary, null, 2));
    fs.writeFileSync(path.join(outDir, "index.html"), html);

    if (pdf) {
      try {
        const reportPage = await browser.newPage();
        await reportPage.goto(pathToFileURL(path.join(outDir, "index.html")).href, {
          waitUntil: "load",
          timeout: 60000,
        });
        await reportPage.evaluate(async () => {
          const images = [...document.images];
          images.forEach((image) => {
            image.loading = "eager";
          });
          await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
          await document.fonts?.ready;
        });
        await reportPage.pdf({
          path: path.join(outDir, "report.pdf"),
          format: "A4",
          landscape: true,
          printBackground: true,
          margin: { top: "9mm", right: "9mm", bottom: "9mm", left: "9mm" },
        });
        await reportPage.close();
      } catch (err) {
        console.error(`PDF generation skipped: ${String(err.message).split("\n")[0]}`);
      }
    }

    console.log(
      `\n${summary.total} shots · ${summary.failed} failed · ${summary.authRedirects} auth redirects · ${summary.withJsErrors} with JS errors · ${summary.withFailedSteps} with failed steps`,
    );
    console.log(`contact sheet: ${path.join(outDir, "index.html")}`);
    if (pdf && fs.existsSync(path.join(outDir, "report.pdf"))) {
      console.log(`pdf: ${path.join(outDir, "report.pdf")}`);
    }

    if (summary.failed > 0 && !allowFailures) {
      process.exitCode = 1;
    }

    return summary;
  } finally {
    await browser.close();
  }
}

// ── Flows ─────────────────────────────────────────────────────────────────────
/**
 * Page activity on the timeline. Uncaught errors, failed requests and 5xx
 * answers are errors (they fail the flow); 4xx answers, cancelled requests
 * (navigation aborts them) and console errors are warnings for the reader.
 */
function watchPage(page, timeline, base) {
  page.on("request", (request) => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(base).origin)
      timeline.add("network", "error", `Foreign-origin request: ${request.url()}`);
  });
  page.on("pageerror", (error) => timeline.add("page", "error", firstLine(error)));
  page.on("console", (message) => {
    if (message.type() === "error") timeline.add("console", "warn", message.text().slice(0, 300));
  });
  page.on("requestfailed", (request) => {
    const reason = request.failure()?.errorText ?? "failed";
    const level = reason.includes("ERR_ABORTED") ? "warn" : "error";
    timeline.add("network", level, `${reason} ${request.method()} ${request.url().slice(0, 200)}`);
  });
  page.on("response", (response) => {
    const status = response.status();
    if (status < 400) return;
    const request = response.request();
    timeline.add(
      "network",
      status >= 500 ? "error" : "warn",
      `${status} ${request.method()} ${response.url().slice(0, 200)}`,
    );
  });
}

/**
 * Runs each flow as one continuous session: opens `flow.start`, runs its
 * steps (shared with shots, plus `goto`, `expect`, `drag`, `mark`, `call`)
 * and writes `<out>/<flow>/timeline.json`, its screenshots and, with
 * `--video`, `<flow>.mp4` and `<flow>.jpg`. The CLI exits 1 when a flow FAILED.
 */
export async function runFlows(options = {}) {
  const scenario = JSON.parse(fs.readFileSync(path.resolve(String(options.script)), "utf8"));
  const wanted = options.flow ? String(options.flow) : null;
  const flows = (scenario.flows ?? []).filter((flow) => !wanted || flow.name === wanted);
  if (!flows.length)
    throw new Error(wanted ? `No flow named ${wanted}` : "The scenario has no flows");
  const calls = options.calls
    ? await import(pathToFileURL(path.resolve(String(options.calls))).href)
    : {};
  const video = !!options.video;
  const session = await openSession(options);
  const { base, browser, outDir, settleMs, timeoutMs } = session;
  const results = [];

  try {
    for (const flow of flows) {
      const [viewport] = viewportsFor(
        options.viewport ?? flow.viewport ?? "desktop",
        FLOW_VIEWPORTS,
      );
      const dir = path.join(outDir, flow.name);
      fs.rmSync(dir, { recursive: true, force: true });
      fs.mkdirSync(dir, { recursive: true });

      // Sign in outside the recording, so the video starts at the flow's first screen.
      if (!session.isPublic) {
        const auth = await session.newContext(viewport);
        await session.signIn(auth, flow.start);
        await auth.close();
      }
      const timeline = createTimeline({
        app: options.app ?? path.basename(path.resolve(String(options.repo || process.cwd()))),
        module: options.module ?? null,
        flow: flow.name,
        title: flow.title ?? flow.name,
        surface: "web",
        target: base + flow.start,
      });
      const ctx = await session.newContext(viewport, {
        recordVideo: video
          ? { dir, size: { width: viewport.width, height: viewport.height } }
          : undefined,
        signedIn: !session.isPublic,
      });
      await ctx.exposeBinding("__reportBridge", (_source, entry) => bridgeEntry(timeline, entry));
      const page = await ctx.newPage();
      watchPage(page, timeline, base);

      let log = [];
      try {
        const response = await page.goto(base + flow.start, {
          waitUntil: "domcontentloaded",
          timeout: timeoutMs,
        });
        const status = response?.status() ?? 200;
        timeline.step(`open ${flow.start}${status >= 400 ? `: HTTP ${status}` : ""}`, status < 400);
        await settle(page, settleMs);
        log = await runSteps(
          page,
          flow.steps ?? [],
          { out: dir, prefix: flow.name },
          {
            base,
            settleMs,
            timeline,
            calls,
            email: session.email,
            password: session.password,
            env: process.env,
          },
        );
        // The video ends on the flow's last screen, not mid-transition.
        await page.waitForTimeout(1000);
      } catch (error) {
        timeline.add("page", "error", firstLine(error));
      }

      const recording = page.video();
      await ctx.close();
      let media = null;
      if (recording) {
        const raw = await recording.path();
        try {
          const out = transcodeVideo(raw, path.join(dir, flow.name), {
            posterAt: flow.posterAt ?? 2,
          });
          media = {
            video: path.basename(out.video),
            poster: out.poster && path.basename(out.poster),
            bytes: out.bytes,
          };
        } catch (error) {
          timeline.add("page", "error", `No video: ${firstLine(error)}`);
        }
        fs.rmSync(raw, { force: true });
      }

      const result = timeline.result({
        note: flow.note ?? null,
        viewport: viewport.name,
        media,
        screenshots: log
          .filter((entry) => entry.file)
          .map(({ file, label, note }) => ({ file, label, note })),
      });
      fs.writeFileSync(path.join(dir, "timeline.json"), `${JSON.stringify(result, null, 2)}\n`);
      results.push(result);
      const failure = result.entries.find((entry) => entry.level === "error");
      console.log(
        `${result.status === "FAILED" ? "✗" : "✓"} flow ${flow.name} ${result.status} · ${result.checks.passed}/${result.checks.passed + result.checks.failed} checks · ${result.durationMs}ms${media ? ` · video ${(media.bytes / 1048576).toFixed(2)} MB` : ""}` +
          (failure ? `\n     ${failure.source}: ${failure.message}` : ""),
      );
    }

    return results;
  } finally {
    await browser.close();
  }
}

// ── CLI Execution ─────────────────────────────────────────────────────────────
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    console.log(`
Web report runner (npm run report)

  --base <url>          The local app's URL (or REPORT_BASE_URL)
  --script <file>       Shots worklist (JSON array), or with --flows a scenario ({ flows })
  --out <dir>           Output directory
  --flows               Run the scenario's flows instead of shots
  --flow <name>         Only this flow
  --video               Record each flow (mp4 + poster; needs ffmpeg)
  --calls <file>        Module of functions that flow "call" steps run
  --module <id>         Report module, written into each timeline
  --headed              Show the browser
  --login-route <route> Login route (default: /en/login)
  --login-script <file> Path to login steps script
  --auth-probe <route>  Protected route to verify cached session
  --locale <code>       Locale (default: en)
  --locale-id <id>      Locale ID (default: en-US)
  --locale-cookie <c>   Locale cookie (default: brainee_locale)
  --timezone <zone>     Timezone (default: America/New_York)
  --settle <ms>         Page settle time in ms (default: 1500)
  --viewport <v>        ipad | phone | desktop | mobile | both (or comma-separated names)
  --storage-state <f>   Existing Playwright storage state file
  --email <e>           Login email
  --password <p>        Login password
  --relogin             Ignore cached auth session
  --no-pdf              Skip PDF report generation
`);
    process.exit(0);
  }

  const run = args.flows
    ? runFlows(args).then((results) => {
        if (results.some((result) => result.status === "FAILED")) process.exitCode = 1;
      })
    : runCapture(args);
  run.catch((err) => {
    console.error("Runner failed:", err.message);
    process.exit(1);
  });
}
