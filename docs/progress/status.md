# Status

> A snapshot: **overwrite it, don't append.** History goes in [log.md](log.md); tasks go in [todo.md](todo.md).

**Updated:** 2026-11-14 · **Phase:** P5 Data (demo subset)

## Phases

| # | Phase | Status | Tasks |
|---|---|---|---|
| P0 | Docs & planning | ✅ done | T-01 – T-05 |
| P1 | Scaffold monorepo + game pipeline | 🔄 in progress (T-17 – T-19 left) | T-10 – T-19 (no T-14) |
| P2 | Core logic + Brainy + game contract | 🔄 in progress (T-26, T-29 left) | T-20 – T-29 |
| P3 | Child flow | 🔄 in progress (two games + post-game preview done) | T-30 – T-38 |
| P4 | Parent flow | ⬜ todo | T-40 – T-46 |
| P5 | Data, auth, live sync | 🔄 in progress (demo session/result API done; polling next) | T-50 – T-55 |
| P6 | PWA + allowlist on a real device | ⬜ todo | T-60 – T-63 |
| P7 | Demo & pitch → **deploy last** | ⬜ todo | T-70 – T-74, then T-14 |

Legend: ✅ done · 🔄 in progress · ⏳ next · ⬜ todo · ⛔ blocked

## Current focus
The [smallest connected demo](todo.md#smallest-end-to-end-demo-slice-t-80) has saved-session APIs. Next: T-55 shared state and UI integration, then the parent proof. The child UI still runs its per-tab preview.

## Handoff
- **Last session:** implemented the T-50/T-51 demo subset (Parent/BrainyState/Game/GameSession, hashed cookie access/run, family version and one idempotent seeded scenario). T-52 cookie access and T-54 start/finish/stop APIs exist; T-81 session validation/replay/atomicity are tested. D-18 defines the [contract](../dev/sessions.md); D-19 records a pinned native libSQL transaction-control patch and deferred optional indexes. Broad T-50/T-51/T-52/T-81 remain open for their other scope. Verified: build and `pnpm check`; 82 unit tests; all 40 Chromium tests and 8 WebKit API/browser-fetch tests. Demo-off smoke: all five endpoint requests return 404 without creating a DB. Full WebKit UI tests are blocked by T-93 (see below); the existing Learn screenshot was reviewed.
- **Next (in order):**
  1. T-55: read [sessions.md](../dev/sessions.md), add a cookie-authorized versioned `/api/state`, then polling and UI wiring. Obtain the issued game ID/seed before play, retain that ID for finish retries, and show only server-acknowledged rewards. Replace preview progress writes; a replayed receipt may contain an older wallet, so refetch current state.
  2. T-40/T-41 demo subset: PIN barrier and parent Brainy/balance/latest game. The demo child cookie alone must not grant parent privilege. Then the two-device proof (T-70/T-71).
  3. T-93 QA: fix the local WebKit input-coordinate problem and rerun the full suite. A standalone bare-button repro and attempts are in [setup.md](../dev/setup.md#webkit-pointer-diagnostics-t-93); do not weaken click assertions. T-92 tracks removal of the driver workaround once upstream regressions pass.
  4. After the connected proof: T-31/T-32 entry and Learn recommendations using T-25, with supplied/labelled age averages (T-83). Other entities, scenario switching, embedded games and motion polish remain later.
- **Notes:** APIs are off unless `DEMO_MODE=1` and the database is prepared; there is no automatic seed/reset on requests. The browser UI still reads `demoChild` and its local preview, not the new API. Saved run state is cookie-scoped; the current preview is per-tab. Prototype gains, age averages and mood decay retain their existing product TBDs. Stale route types: delete `apps/web/.next/dev`.
- **Rules to keep:** single `master` branch; no deploy work before T-14; don't assume a long-running process or a writable disk; `getDatabaseConfig` stays `file:`-only until T-14.
- **Blockers / open questions:** T-93 blocks complete WebKit UI verification on this Mac: requested click coordinates produce unrelated native pointer coordinates, including on a bare button. Reinstall, headed mode and one worker did not resolve it. API tests pass in WebKit; Chromium UI/API and DB tests pass. No blocker to implementing T-55. Product TBDs remain in [overview.md](../product/overview.md#open-questions-tbd).
