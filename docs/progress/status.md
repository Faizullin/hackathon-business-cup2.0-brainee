# Status

> A snapshot: **overwrite it, don't append.** History goes in [log.md](log.md); tasks go in [todo.md](todo.md).

**Updated:** 2026-11-14 · **Phase:** P5 Data (demo subset)

## Phases

| # | Phase | Status | Tasks |
|---|---|---|---|
| P0 | Docs & planning | ✅ done | T-01 – T-05 |
| P1 | Scaffold monorepo + game pipeline | 🔄 in progress (T-17 – T-19 left) | T-10 – T-19 (no T-14) |
| P2 | Core logic + Brainy + game contract | 🔄 in progress (T-26, T-29 left) | T-20 – T-29 |
| P3 | Child flow | 🔄 in progress (two games + saved learning loop done) | T-30 – T-38 |
| P4 | Parent flow | ⬜ todo | T-40 – T-46 |
| P5 | Data, auth, live sync | 🔄 in progress (saved child flow + polling done; parent next) | T-50 – T-55 |
| P6 | PWA + allowlist on a real device | ⬜ todo | T-60 – T-63 |
| P7 | Demo & pitch → **deploy last** | ⬜ todo | T-70 – T-74, then T-14 |

Legend: ✅ done · 🔄 in progress · ⏳ next · ⬜ todo · ⛔ blocked

## Current focus
The [smallest connected demo](todo.md#smallest-end-to-end-demo-slice-t-80) now has saved child progression, result recovery and polling between child devices. Next: the parent PIN barrier and minimal saved-result view, then the child → parent proof. T-55 remains open for its parent consumer.

## Handoff
- **Latest (reports):** added the `learning` report module and re-recorded both reports ([learning.md](../reports/learning.md), [scaffold.md](../reports/scaffold.md)); the MVP gap map is in [todo.md](todo.md#road-to-mvp-acceptance-criteria--remaining-tasks). New T-94 (practice card repeats the current game). No app code changed.
- **Previous session:** implemented the T-55 child subset: one cookie-authorized snapshot read, conditional `/api/state`, three-second TanStack Query polling and server-issued game launches. Child wallet/Brainy/mood use saved state; local reward writes and the old preview provider are removed. Finishes retain the original issued ID/result across failed requests or reloads and wait for a fresh snapshot before showing completion. Historical receipts cannot lower a newer balance. Stop waits for the API and increments the shared version. D-20 extends the [session contract](../dev/sessions.md). Verified: build and `pnpm check`; 86 unit tests; all 112 e2e checks (Chromium + WebKit, phone + iPad); WebKit error/result/synced-state screenshots reviewed. Demo-off smoke: six endpoint requests return 404 without creating a DB. T-93 no longer blocks QA: normal WebKit clicks passed; the original native failure's cause remains unconfirmed.
- **Next (in order):**
  1. T-40 demo subset: read [sessions.md](../dev/sessions.md) and the parent section of [screens.md](../product/screens.md#parent), then add the PIN barrier and parent navigation. The demo child cookie alone must not grant parent privilege. `/analytics` is still a placeholder and does not query child state.
  2. T-41 demo subset + remaining T-55: protected parent Brainy/balance/latest game, consuming versioned polling without refresh. Do not add all analytics yet. Then verify the child → parent two-device proof (T-70/T-71) and close T-55.
  3. After the connected proof: T-31/T-32 entry and Learn recommendations using T-25, with supplied/labelled age averages (T-83). Other entities, scenario switching, embedded games and motion polish remain later. T-92 retains the native driver/index follow-up.
- **Notes:** connected child screens require `DEMO_MODE=1` and a prepared database; there is no request-time seed/reset or fake-progress fallback. `demoChild` now holds only accessory/weekly-goal presentation for T-38/T-46. Only unacknowledged results use per-tab storage; blocked storage still permits an in-memory retry. Saved streak/bonus state is cookie-scoped, shared by its tabs. Access expiry asks for an explicit reload. Prototype gains, age averages and mood decay retain their existing product TBDs. Stale route types: delete `apps/web/.next/dev`.
- **Rules to keep:** single `master` branch; no deploy work before T-14; don't assume a long-running process or a writable disk; `getDatabaseConfig` stays `file:`-only until T-14.
- **Blockers / open questions:** none for the parent demo slice. Broad T-50/T-51/T-52/T-81 remain open for their other scope. Keep the [WebKit repro](../dev/setup.md#webkit-pointer-diagnostics-t-93) if its intermittent native failure returns. Product TBDs remain in [overview.md](../product/overview.md#open-questions-tbd).
