# Status

> A snapshot: **overwrite it, don't append.** History goes in [log.md](log.md); tasks go in [todo.md](todo.md).

**Updated:** 2026-11-14 · **Phase:** P1 Scaffold (in progress)

## Phases

| # | Phase | Status | Tasks |
|---|---|---|---|
| P0 | Docs & planning | ✅ done | T-01 – T-05 |
| P1 | Scaffold monorepo + game pipeline | 🔄 in progress (T-17 – T-19 left) | T-10 – T-19 (no T-14) |
| P2 | Core logic + Brainy + game contract | 🔄 in progress (T-26, T-29 left) | T-20 – T-29 |
| P3 | Child flow | 🔄 in progress (two games + post-game preview done) | T-30 – T-38 |
| P4 | Parent flow | ⬜ todo | T-40 – T-46 |
| P5 | Data, auth, live sync | ⬜ todo | T-50 – T-55 |
| P6 | PWA + allowlist on a real device | ⬜ todo | T-60 – T-63 |
| P7 | Demo & pitch → **deploy last** | ⬜ todo | T-70 – T-74, then T-14 |

Legend: ✅ done · 🔄 in progress · ⏳ next · ⬜ todo · ⛔ blocked

## Current focus
The [smallest connected demo](todo.md#smallest-end-to-end-demo-slice-t-80) is scoped. Its child flow works as a per-tab preview (T-34/T-35); next is the shared data slice that will let the parent see a saved result.

## Handoff
- **Last session:** T-80 records the exact demo task scope. T-35 adds Brainy before/after, actual capped stat chips, earned stars, next choices, stop/thank-you and the one-time third-game bonus/break. Core owns the transition; dock and Brainy tab read the same preview. T-34 adds Continue the pattern (2 × 4 seeded rounds), shared `kit/Shape` and host-supplied game text. T-24 adds injected gain-policy/70–30 splitting + ability rollup; T-25 adds entry recommendations. D-17 records the preview boundary. Verified: `pnpm check`, `pnpm test` (70 unit tests), `pnpm e2e` (64 tests in Chromium + WebKit, phone + iPad); WebKit post-game, break and pattern screenshots reviewed.
- **Next (in order):**
  1. T-50/T-51 demo subset: Parent, BrainyState, Game, GameSession and wallet/state versioning for one deterministic family. Read [data-model.md](../product/data-model.md) and the T-80 scope; leave unrelated entities out of this increment and the broad task checkboxes open.
  2. T-52 seeded family session, then T-81/T-54: validate and deduplicate finishes, call core and atomically save rewards/stats/session. Cover retries and rollback before wiring the UI.
  3. T-55: versioned state endpoint + polling; replace the [temporary preview](../dev/ui.md#temporary-learning-preview-t-35). T-40/T-41 demo subset: PIN barrier, parent Brainy/balance/latest game, then the two-device proof (T-70/T-71).
  4. After the connected proof: T-31/T-32 entry and Learn recommendations using T-25, with explicitly labelled/supplied age averages (T-83). Embedded games and motion polish remain later.
- **Notes:** `demoChild` still initializes client data; there are no DB writes or parent sync. Prototype per-game gains remain in `prototypeStatGains`; the new T-24 policy has no approved calibration. T-25 requires age averages/history/time and is not wired to the entry UI. Mood decay is still TBD. Stale `.next/dev/types` after moving routes: delete `apps/web/.next/dev`.
- **Rules to keep:** single `master` branch; no deploy work before T-14; don't assume a long-running process or a writable disk; `getDatabaseConfig` stays `file:`-only until T-14.
- **Blockers / open questions:** none for the demo data slice. Product TBDs remain in [overview.md](../product/overview.md#open-questions-tbd).
