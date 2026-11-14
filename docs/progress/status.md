# Status

> A snapshot: **overwrite it, don't append.** History goes in [log.md](log.md); tasks go in [todo.md](todo.md).

**Updated:** 2026-11-15 · **Phase:** P7 demo prep + redesign implementation

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
The lavender redesign now includes published D-33 films, D-34 English-only platform behavior and input hardening from `origin/master`, integrated in `../brainee-merge-trial` on `merge/origin-master`. Ready for owner review with the verification limits below.

## Handoff
- **#8 (branch `feature/games-autodiscovery-thumbnails`, PR to `master`):** game auto-discovery from each folder (D-38), required thumbnails on every game card, and the first Explore wave from GSP (Shape Pairs, Color Boxes, Sticker Scene) with declarative Explore metadata. Details and results: [batch handoff](../games/batches/2026-11-15-autodiscovery-thumbnails-wave1.md).
- **Passed:** `pnpm check`, 339 unit tests, `games:build`, `check:manifests`, `test:assets`, production build; full tiered e2e 214/215, the remaining stale assertion fixed and its spec re-run 6/6. Phone and iPad screenshots reviewed.
- **Next:** owner review/merge of the PR; physical iPad touch check of the new previews; T-147 archive family adapters (QLOBE first); T-148 promotion decisions. T-139 (combined full serial run and recordings) remains open.
- **Not done here:** no deploy, no push to `master`, no shared or deployed DB touched.
