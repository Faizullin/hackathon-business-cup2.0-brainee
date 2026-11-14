// biome-ignore-all lint/suspicious/noUndeclaredEnvVars: Standalone reports run outside Turborepo caching.
// Ported from game-store-planning; local adaptations are documented in docs/reports/README.md.
import { execFileSync, spawn } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateReport } from "./reports/generate.mjs";
import { hasFfmpeg } from "./reports/media.mjs";
import { modules, reportModule, resolveWorklist, settings } from "./reports/modules.mjs";

const HELP = `Usage: pnpm report [options]

  --list                 Modules, their fixtures and flows
  --module <id>          Report module (default: ${settings.defaultModule})
  --shots                Screenshots only
  --flows                Flows only
  --flow <name>          One flow only
  --video                Record flows (mp4 + poster; needs ffmpeg)
  --viewport <v>         Override flow viewport: phone, ipad, desktop or mobile
  --base <url>           Local app URL (default: REPORT_BASE_URL or ${settings.baseUrl})
  --headed               Show the browser
  --from <dir>           Re-render from a saved shots capture, no browser
  --status [--watch]     Progress of the running or last report
`;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const options = {
  module: settings.defaultModule,
  from: null,
  flow: null,
  viewport: null,
  base: null,
};
const flags = new Set();
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "--") continue;
  const name = arg.slice(2);
  if (["--module", "--from", "--flow", "--viewport", "--base"].includes(arg)) {
    const value = args[++i];
    if (!value || value.startsWith("--")) throw new Error(`${arg} needs a value`);
    options[name] = value;
  } else if (
    ["--status", "--watch", "--list", "--shots", "--flows", "--video", "--headed"].includes(arg)
  )
    flags.add(name);
  else if (arg === "--help" || arg === "-h") {
    console.log(HELP);
    process.exit(0);
  } else throw new Error(`Unknown option: ${arg}\n\n${HELP}`);
}
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

if (flags.has("list")) {
  for (const [name, entry] of Object.entries(modules)) {
    const fixtureList = Object.values(entry.fixtures)
      .map((f) => f.env + (f.fallback ? ` (default ${f.fallback})` : ""))
      .join(", ");
    const flows = (readJson(path.join(root, entry.scenario)).flows ?? []).map((flow) => flow.name);
    console.log(
      `${name}: ${entry.title}\n  docs/reports/${name}.md\n  Fixtures: ${fixtureList || "none"}\n  Flows: ${flows.join(", ") || "none"}`,
    );
  }
  process.exit(0);
}
if (flags.has("watch") && !flags.has("status")) throw new Error("--watch requires --status");
if (flags.has("shots") && (flags.has("flows") || options.flow))
  throw new Error("--shots runs screenshots only; drop --flows/--flow");

if (options.viewport && !["phone", "ipad", "desktop", "mobile"].includes(options.viewport))
  throw new Error("--viewport must be phone, ipad, desktop or mobile");

const id = options.module;
const mod = reportModule(id);
const scenario = readJson(path.join(root, mod.scenario));
const shots = scenario.shots ?? [];
const flows = (scenario.flows ?? []).filter((flow) => !options.flow || flow.name === options.flow);
if (options.flow && !flows.length) throw new Error(`${id} has no flow named ${options.flow}`);
const runShots = !options.from && !flags.has("flows") && !options.flow && shots.length > 0;
const runFlows = !options.from && !flags.has("shots") && flows.length > 0;

const directory = path.join(root, "docs/reports/.captures", id);
const capture = path.resolve(root, options.from ?? path.join(directory, "latest"));
const flowsDir = path.join(directory, "flows");
const stateFile = path.join(directory, "run-state.json");
const lockFile = path.join(directory, "run.lock.json");
const logFile = path.join(directory, "run.log");
const readState = (file) => {
  try {
    return readJson(file);
  } catch {
    return null;
  }
};
const alive = (pid) => {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};
const total =
  (runShots ? shots.reduce((sum, entry) => sum + entry.shots.length, 0) * 2 : 0) +
  (runFlows ? flows.length : 0);
const showStatus = () => {
  const run = readState(stateFile);
  const active = run && ["running", "rendering"].includes(run.phase);
  const phase = active && !alive(run.pid) ? "stopped" : (run?.phase ?? "not started");
  const count = run?.completed ?? 0,
    expected = run?.total ?? total;
  console.log(
    `Module: ${id}\nStatus: ${phase}\nProgress: ${count}/${expected} captures and flows (${expected ? Math.floor((count / expected) * 100) : 0}%)\nCapture warnings/errors: ${run?.warnings ?? 0}\nLast: ${run?.last ?? "Waiting for the first capture"}\nLog: ${path.relative(root, logFile)}`,
  );
  if (run?.error) console.log(`Error: ${run.error}`);
};
if (flags.has("status")) {
  do {
    if (flags.has("watch") && process.stdout.isTTY) console.clear();
    showStatus();
    if (flags.has("watch")) await new Promise((resolve) => setTimeout(resolve, 2000));
  } while (flags.has("watch"));
  process.exit(0);
}

mkdirSync(directory, { recursive: true });
if (existsSync(lockFile)) {
  const owner = readState(lockFile);
  if (owner && alive(owner.pid))
    throw new Error(`${id} report is already running (PID ${owner.pid}).`);
  unlinkSync(lockFile);
}
writeFileSync(lockFile, JSON.stringify({ pid: process.pid }), { flag: "wx" });
let child;
let interrupted = false;
const run = {
  module: id,
  pid: process.pid,
  phase: "running",
  completed: 0,
  total,
  warnings: 0,
  last: options.from ? "Rendering saved capture (no browser actions)" : null,
  startedAt: new Date().toISOString(),
  capture,
};
const saveState = () => {
  writeFileSync(`${stateFile}.tmp`, JSON.stringify(run, null, 2));
  renameSync(`${stateFile}.tmp`, stateFile);
};
const log = (message) => {
  process.stdout.write(message);
  appendFileSync(logFile, message);
};
const stop = (signal) => {
  interrupted = true;
  child?.kill(signal);
};
const onInterrupt = () => stop("SIGINT");
const onTerminate = () => stop("SIGTERM");
process.on("SIGINT", onInterrupt);
process.on("SIGTERM", onTerminate);

/** Runs scripts/reports/web.mjs, counting its ✓/✗ lines as progress. */
async function runWeb(env, webArgs) {
  let pending = "";
  const consume = (chunk) => {
    const text = chunk.toString();
    log(text);
    pending += text;
    const lines = pending.split(/\r?\n/);
    pending = lines.pop();
    for (const line of lines)
      if (
        /^(?:✓|✗|⚠(?: login)?)\s+(?:\d{3}|---)\s+\d+ms\s/.test(line) ||
        /^(?:✓|✗) flow /.test(line)
      ) {
        run.completed += 1;
        if (!line.startsWith("✓")) run.warnings += 1;
        run.last = line;
        saveState();
      }
  };
  const web = path.join(root, "scripts/reports/web.mjs");
  const code = await new Promise((resolve, reject) => {
    child = spawn(process.execPath, [web, ...webArgs], {
      cwd: root,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.on("data", consume);
    child.stderr.on("data", consume);
    child.on("error", reject);
    child.on("close", resolve);
  });
  if (interrupted) throw new Error("Report interrupted");
  return code;
}

writeFileSync(logFile, "");
saveState();
try {
  if (runFlows && flags.has("video") && !hasFfmpeg())
    throw new Error(
      "ffmpeg is needed for --video. Install it before recording (macOS: brew install ffmpeg).",
    );
  const base =
    options.base ??
    process.env.REPORT_BASE_URL ??
    (settings.baseEnv && process.env[settings.baseEnv]) ??
    settings.baseUrl;
  if (
    (runShots || runFlows) &&
    !["localhost", "127.0.0.1", "[::1]"].includes(new URL(base).hostname)
  )
    throw new Error(
      "Reports use local disposable fixtures. Set --base or REPORT_BASE_URL to a local server.",
    );
  const common = [
    "--base",
    base,
    "--repo",
    root,
    "--locale",
    settings.locale ?? "ru",
    "--locale-id",
    settings.localeId ?? "ru-RU",
    "--locale-cookie",
    "Next-Locale",
    "--timezone",
    "Asia/Almaty",
    "--settle",
    "1500",
  ];
  const { args: signIn, env } =
    runShots || runFlows ? signInSetup() : { args: [], env: process.env };
  common.push(...signIn);
  if (flags.has("headed")) common.push("--headed");

  if (runShots) {
    mkdirSync(capture, { recursive: true });
    const shotsScript = path.join(capture, "shots.json");
    // Fixtures resolve for what runs: one flow needs only its own IDs.
    writeFileSync(shotsScript, `${JSON.stringify(resolveWorklist(mod, shots), null, 2)}\n`);
    const code = await runWeb(env, [
      ...common,
      "--script",
      shotsScript,
      "--viewport",
      (mod.viewports ?? ["desktop", "mobile"]).join(","),
      "--title",
      mod.title,
      "--out",
      capture,
    ]);
    if (code !== 0) throw new Error(`Shots runner exited ${code}; inspect ${capture}/index.html`);
    writeSource(capture);
  }

  if (runFlows) {
    mkdirSync(flowsDir, { recursive: true });
    const flowsScript = path.join(flowsDir, "scenario.json");
    writeFileSync(
      flowsScript,
      `${JSON.stringify({ flows: resolveWorklist(mod, flows) }, null, 2)}\n`,
    );
    const calls = path.join(root, mod.scenario.replace(/\.json$/, ".mjs"));
    const code = await runWeb(env, [
      ...common,
      "--flows",
      "--script",
      flowsScript,
      "--module",
      id,
      "--out",
      flowsDir,
      ...(options.flow ? ["--flow", options.flow] : []),
      ...(flags.has("video") ? ["--video"] : []),
      ...(options.viewport ? ["--viewport", options.viewport] : []),
      ...(existsSync(calls) ? ["--calls", calls] : []),
    ]);
    if (code !== 0)
      throw new Error(
        `A flow failed; its timeline is in ${path.relative(root, flowsDir)}/<flow>/timeline.json`,
      );
  }

  run.phase = "rendering";
  saveState();
  const result = await generateReport({ root, module: mod, capture, worklist: shots, flowsDir });
  run.phase = "completed";
  // Generation also includes saved captures; progress counts only this run.
  run.completed = total;
  saveState();
  log(
    `Generated ${result.output}${result.flows ? ` with ${result.flows} flow(s)` : ""}\n` +
      (existsSync(path.join(capture, "index.html")) ? `Full capture: ${capture}/index.html\n` : ""),
  );
} catch (error) {
  run.phase = interrupted ? "stopped" : "failed";
  run.error = error.message;
  saveState();
  log(`Error: ${error.message}\n`);
  process.exitCode = interrupted ? 130 : 1;
} finally {
  if (readState(lockFile)?.pid === process.pid) unlinkSync(lockFile);
  process.removeListener("SIGINT", onInterrupt);
  process.removeListener("SIGTERM", onTerminate);
}

/**
 * Public apps run with `--public`. Otherwise the runner signs in with a saved
 * Playwright state, or fresh as REPORT_EMAIL / REPORT_PASSWORD, falling back
 * to the module settings' local fixture account. Credentials reach the runner
 * through its environment, so they never appear in a command line.
 */
function signInSetup() {
  const { auth } = settings;
  if (!auth) return { args: ["--public"], env: process.env };
  const storage = auth.storageEnv.map((name) => process.env[name]).find(Boolean);
  const email = process.env.REPORT_EMAIL ?? process.env.UISHOT_EMAIL ?? auth.email;
  const password = process.env.REPORT_PASSWORD ?? process.env.UISHOT_PASSWORD ?? auth.password;
  if (!storage && (!email || !password))
    throw new Error(`Set REPORT_EMAIL/REPORT_PASSWORD privately, or ${auth.storageEnv[0]}.`);
  const args = [
    "--login-route",
    auth.loginRoute,
    "--login-script",
    path.join(root, auth.loginScript),
    "--auth-probe",
    auth.authProbe,
  ];
  return {
    args: storage ? [...args, "--storage-state", path.resolve(storage)] : [...args, "--relogin"],
    env: { ...process.env, REPORT_EMAIL: email, REPORT_PASSWORD: password },
  };
}

/** Which commit (and whether a dirty tree) a capture came from. */
function writeSource(dir) {
  let commit = "uncommitted";
  try {
    commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim();
  } catch {
    // repository without commits yet
  }
  const dirty =
    execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).trim() !== "";
  writeFileSync(
    path.join(dir, "source.json"),
    JSON.stringify({ module: id, commit, dirty }, null, 2),
  );
}
