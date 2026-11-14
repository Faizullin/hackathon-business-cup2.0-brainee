# Status

> A snapshot: **overwrite it, don't append.** History goes in [log.md](log.md); tasks go in [todo.md](todo.md).

**Updated:** 2026-11-14 · **Phase:** P1 Scaffold (in progress)

## Phases

| # | Phase | Status | Tasks |
|---|---|---|---|
| P0 | Docs & planning | ✅ done | T-01 – T-05 |
| P1 | Scaffold monorepo + game pipeline | 🔄 in progress (T-17 – T-19 left) | T-10 – T-19 (no T-14) |
| P2 | Core logic + Brainy + game contract | 🔄 in progress (T-24 – T-26, T-29 left) | T-20 – T-29 |
| P3 | Child flow | 🔄 in progress (shell done) | T-30 – T-38 |
| P4 | Parent flow | ⬜ todo | T-40 – T-46 |
| P5 | Data, auth, live sync | ⬜ todo | T-50 – T-55 |
| P6 | PWA + allowlist on a real device | ⬜ todo | T-60 – T-63 |
| P7 | Demo & pitch → **deploy last** | ⬜ todo | T-70 – T-74, then T-14 |

Legend: ✅ done · 🔄 in progress · ⏳ next · ⬜ todo · ⛔ blocked

## Current focus
Brainy renderer, accessory rules and the child app shell are done (T-20, T-27, T-30); game architecture for scale is recorded (D-16). Next: define the demo slice (T-80), then the post-game screen (T-35).

## Handoff
- **Last session:** git cleaned to a single `master` branch (local + GitHub); personal notes moved to gitignored `.local/`. Implemented T-20 (`packages/brainy`: pure `brainyModel` + `<Brainy>` SVG, presets, `/lab/brainy`), T-27 (accessory catalog, `equip`/`unequip`, `buyAccessory` in `core`) and T-30 (child shell: 4-tab bottom bar, Brainy dock via `(child)/(docked)`, Brainy tab, Leisure/Gifts stubs, Learn game grid, fullscreen `(game)/game/[id]` with exit + finish card). Recorded D-16 (three game paths, artifacts, conformance) + T-89 – T-91. Verified: `pnpm check` clean; 51 unit tests; 44 e2e (Chromium + WebKit, phone + iPad); WebKit screenshots of dock/learn, game and Brainy tab reviewed.
- **Next (in order):**
  1. T-80: write the smallest end-to-end demo slice into todo.md (child plays → ★ + Brainy change → parent sees it).
  2. T-35: post-game screen in `(game)`: Brainy before → after (`applyStatGains`), «Что дальше?» (weak-skill game + next level), «Хватит на сегодня», break after 3 (`completeLearningGame`).
  3. T-34: Continue the pattern (prototype lines 909–925); move `Shape` into the games kit.
  4. T-24 + T-25: stat-gain formula (70/30) and entry recommendation algorithm in `core`, then T-31 entry screen.
  5. T-50/T-51 + T-54: schema for the remaining entities, scenario seeds, `POST /api/sessions` → core → db; then replace `demoChild` reads.
- **Notes:** child data is the `demoChild` fixture (no writes). Finish card stars are a preview; real rewards are T-54. Mood decay is a product TBD. Stale `.next/dev/types` after moving routes breaks `typecheck`: delete `apps/web/.next/dev`.
- **Rules to keep:** single `master` branch; no deploy work before T-14; don't assume a long-running process or a writable disk; `getDatabaseConfig` stays `file:`-only until T-14.
- **Blockers / open questions:** none. Product TBDs remain in [overview.md](../product/overview.md#open-questions-tbd).
