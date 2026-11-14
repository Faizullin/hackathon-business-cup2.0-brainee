# Status

> A snapshot: **overwrite it, don't append.** History goes in [log.md](log.md); tasks go in [todo.md](todo.md).

**Updated:** 2026-11-15 · **Phase:** P7 demo prep + redesign planning

## Phases

| # | Phase | Status | Tasks |
|---|---|---|---|
| P0 | Docs & planning | ✅ done | T-01 – T-05 |
| P1 | Scaffold monorepo + game pipeline | 🔄 in progress (T-17 – T-18 left) | T-10 – T-19 (no T-14) |
| P2 | Core logic + Brainy + game contract | ✅ done | T-20 – T-29 |
| P3 | Child flow | ✅ presentation scope done | T-30 – T-38 |
| P4 | Parent flow | ✅ presentation scope done | T-40 – T-46 |
| P5 | Data, auth, live sync | ✅ presentation scope done; broader data tasks remain | T-50 – T-55 |
| P6 | PWA + allowlist on a real device | 🔄 manifest and network audit done; real device next | T-60 – T-63 |
| P7 | Demo & pitch → **deploy last** | 🔄 acceptance walk and demo script done | T-70 – T-74, then T-14 |

Legend: ✅ done · 🔄 in progress · ⏳ next · ⬜ todo · ⛔ blocked

## Current focus
**Lavender redesign and parent funnel** per [plans/redesign.md](../plans/redesign.md) (T-131–T-142, D-35/D-36/D-37; visuals from [product/design.md](../product/design.md)), after the PR #1 films integration (issue #5). Games continue separately (issue #4). The jury-ready MVP stays working throughout: see [demo.md](../demo.md).

## Handoff
- Lavender redesign on master: T-133 core funnel, T-131 shared visual system and T-132 Brain component port and T-134 step/answer primitives are complete. Brainy uses mood for energy, body stats for geometry, real stages for size/lightning, re-anchored accessories and earned flags. Kid mode is default; animated heroes share one demand-driven 30 fps ticker, paused for reduced motion, hidden documents and off-screen instances.
- Verification: check, workspace tests and production build pass. T-131 browser matrix 56/56; T-132 corrected matrix 60/60 across Chromium/WebKit phone/iPad. Initial T-132 run exposed stale Eyes/idle-class test selectors; fixed and rerun. Four reference states and screenshots reviewed in all projects.
- T-134: Base UI radio rows, focus-managed step pages, pinned actions and two-column iPad art. Check/test/build and four browser/viewport cases pass; reviewed screenshots and fixed native progress styling.
- T-140 complete: dark heroes, five-item hub/rail, Path with weekly activity and earned rewards; saved learning stars today computed in core. Check/test/build and 60/60 browser cases pass. iPad screenshots reviewed first.
- Next: T-141 and funnel/product tasks in plans/redesign.md order. Final full serial e2e and T-139 recordings remain pending.
- No push, deployment or production data access. Game internals and existing translations remain untouched.
