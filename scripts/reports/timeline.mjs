// Ported from game-store-planning; local adaptations are documented in docs/reports/README.md.
/**
 * A flow's timeline: every step, check, console message, failed request,
 * bridge event and device log line, timed from the flow's start so entries
 * line up with its video.
 */

export const SOURCES = ["step", "check", "mark", "console", "page", "network", "bridge", "device"];
export const LEVELS = ["info", "warn", "error"];

/** `mm:ss.mmm` from milliseconds. */
export function formatTime(ms) {
  const total = Math.max(0, Math.round(ms));
  const minutes = String(Math.floor(total / 60000)).padStart(2, "0");
  const seconds = String(Math.floor((total % 60000) / 1000)).padStart(2, "0");
  return `${minutes}:${seconds}.${String(total % 1000).padStart(3, "0")}`;
}

/**
 * FAILED on any error; PASSED when at least one check ran and none failed;
 * CAPTURED when nothing was checked: a run never claims more than it tested.
 */
export function timelineStatus(entries) {
  if (entries.some((entry) => entry.level === "error")) return "FAILED";
  return entries.some((entry) => entry.source === "check") ? "PASSED" : "CAPTURED";
}

export function createTimeline({
  app,
  module,
  flow,
  title = flow,
  surface,
  target,
  now = Date.now,
}) {
  const startedAt = now();
  const entries = [];
  const add = (source, level, message, data) => {
    if (!SOURCES.includes(source)) throw new Error(`Unknown timeline source: ${source}`);
    if (!LEVELS.includes(level)) throw new Error(`Unknown timeline level: ${level}`);
    const entry = { t: now() - startedAt, source, level, message: String(message) };
    if (data !== undefined) entry.data = data;
    entries.push(entry);
    return entry;
  };
  return {
    entries,
    add,
    /** Milliseconds since the flow started. */
    elapsed: () => now() - startedAt,
    step: (message, ok = true, data) => add("step", ok ? "info" : "error", message, data),
    /** A checked outcome: a failed check is an error, so the flow reports FAILED. */
    check: (ok, message, data) => {
      add("check", ok ? "info" : "error", ok ? message : `Check failed: ${message}`, data);
      return Boolean(ok);
    },
    mark: (message) => add("mark", "info", message),
    result(extra = {}) {
      const checks = entries.filter((entry) => entry.source === "check");
      const failed = checks.filter((entry) => entry.level === "error").length;
      return {
        app,
        module,
        flow,
        title,
        surface,
        target,
        startedAt: new Date(startedAt).toISOString(),
        durationMs: now() - startedAt,
        status: timelineStatus(entries),
        checks: { passed: checks.length - failed, failed },
        errors: entries.filter((entry) => entry.level === "error").length,
        ...extra,
        entries,
      };
    },
  };
}

/**
 * Bridge traffic a host reports (`{ kind, name, ok?, data? }`): the store page
 * through `window.__reportBridge`, the Flutter app as `PECS_BRIDGE` log lines.
 * Messages are what checks match: an event's name, `lifecycle:<phase>`,
 * `status:<status>`, `call:<method>`.
 */
export function bridgeEntry(timeline, entry) {
  const name = String(entry?.name ?? "");
  switch (entry?.kind) {
    case "event":
      return timeline.add("bridge", "info", name, entry.data);
    case "lifecycle":
      return timeline.add("bridge", "info", `lifecycle:${name}`);
    case "status":
      return timeline.add("bridge", name === "unbridged" ? "warn" : "info", `status:${name}`);
    case "call":
      return entry.ok === false
        ? timeline.add("bridge", "warn", `call:${name} failed`, entry.data)
        : timeline.add("bridge", "info", `call:${name}`);
    default:
      return timeline.add(
        "bridge",
        "warn",
        `unknown bridge report ${JSON.stringify(entry).slice(0, 200)}`,
      );
  }
}
