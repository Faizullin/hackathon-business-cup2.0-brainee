# Status

> A snapshot: **overwrite it, don't append.** History goes in [log.md](log.md); tasks go in [todo.md](todo.md).

**Updated:** 2026-11-14 · **Phase:** P1 Scaffold (in progress)

## Phases

| # | Phase | Status | Tasks |
|---|---|---|---|
| P0 | Docs & planning | ✅ done | T-01 – T-05 |
| P1 | Scaffold monorepo + game pipeline | 🔄 in progress (T-17 – T-19 left) | T-10 – T-19 (no T-14) |
| P2 | Core logic + Brainy + game contract | 🔄 in progress (T-20, T-24 – T-27, T-29 left) | T-20 – T-29 |
| P3 | Child flow | ⬜ todo | T-30 – T-38 |
| P4 | Parent flow | ⬜ todo | T-40 – T-46 |
| P5 | Data, auth, live sync | ⬜ todo | T-50 – T-55 |
| P6 | PWA + allowlist on a real device | ⬜ todo | T-60 – T-63 |
| P7 | Demo & pitch → **deploy last** | ⬜ todo | T-70 – T-74, then T-14 |

Legend: ✅ done · 🔄 in progress · ⏳ next · ⬜ todo · ⛔ blocked

## Current focus
Game contract, first React game, `/lab` harness and core economy/stage rules are done (T-16, T-21 – T-23, T-28, T-33). Next: the Brainy renderer (T-20), then the child app shell (T-30).

## Handoff
- **Last session:** implemented T-28 (`core` types + seeded RNG; `games` kit, lazy registry, `GameHost` with error boundary; `pnpm check:games`), T-33 (Odd one out, seeded 9/12-cell rounds), T-16 (`/lab` with event stream `data-status`, 404 in prod unless `BRAINEE_LAB=1`) and T-21 – T-23 (star rules, streak bonus, ☀→★ exchange, gifts, stages, mood, stat gains). Verified: `pnpm check` clean; 16 core + 5 games + 18 DB tests; 28 e2e (Chromium + WebKit, phone + iPad) incl. lab play-through; prod lab gating 404/200; WebKit phone screenshot reviewed.
- **Next (in order):**
  1. T-20: port `brainy(s, id, acc)` (prototype lines 671–733) to `packages/brainy` as a typed React SVG, using `stageOf`/`bodyAverage` from `core`; show START/NOW/FUN presets in `/lab` (add a Brainy tab).
  2. T-30: child app shell: Brainy dock + 4-tab bottom bar in `(child)/layout`, fullscreen `(game)` layout, app-feel checklist ([ui.md](../dev/ui.md)).
  3. T-80: define the smallest end-to-end demo slice before the rest of P3.
  4. T-34: Continue the pattern (prototype `GAMES.pattern`); move `Shape` into the kit once two games share it.
  5. T-29 + T-19 + T-85: bridge, build pipeline and shape-match from game-store-planning.
- **Notes:** the lab's native `<select>`s render shorter than the 48 px fields in WebKit (dev tool only; acceptable). `STAR_RULES.popsciCorrect` exists but the science-video flow is T-37. Mood decay is a product TBD.
- **Rules to keep:** no deploy work before T-14; don't assume a long-running process or a writable disk; `getDatabaseConfig` stays `file:`-only until T-14.
- **Blockers / open questions:** none. Product TBDs remain in [overview.md](../product/overview.md#open-questions-tbd).
