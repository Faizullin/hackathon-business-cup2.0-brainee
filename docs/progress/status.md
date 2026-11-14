# Status

> A snapshot: **overwrite it, don't append.** History goes in [log.md](log.md); tasks go in [todo.md](todo.md).

**Updated:** 2026-11-15 · **Phase:** P7 Demo prep (all pages built)

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
**Jury-ready presentation MVP:** one-tap isolated family access, quiz-first or simple signup, paired devices, saved learning/tasks/rewards and playable Snake. Activity analytics use real saved actions; historical/character radars and rankings remain labelled demo. See [demo.md](../demo.md) and the [remaining road map](todo.md#road-to-mvp-acceptance-criteria--remaining-tasks).

## Handoff
- **Branch / PR:** `feature/english-games-and-films` off `master` `b1a3c68`; resolves issues #4 and #5. Not merged, not deployed; production DB untouched.
- **Films (issue #5, D-33):** PR #1 squash-merged (no 12 MB blobs or merge commits in history). `sky-blue`, `rain`, `sun-goes` re-encoded to 64 kbps mono (~6 MB each, durations unchanged); `make_film.py` always encodes that way. Conflicts kept master's localized lab nav and decorative Brainy label plus the film link and `talk` mouth; lockfile regenerated. `videos/` and `.next-*/` gitignored; [films.md](../dev/films.md) records tools, key handling, provenance and the content review. **Owner:** record the ElevenLabs voice and commercial-use terms (T-124).
- **English-only (D-34):** no Russian in host, games, films, tests or docs. Removed `ru.ts`, locale switchers/cookie, `BRAINEE_DEFAULT_LOCALE`, the RU→EN content map and the Russian `docs/ideas/` sources (in history at `b1a3c68`). `ru-RU` date formatting in Gifts fixed. `english.spec.ts` fails on any Cyrillic in host pages, games or previews.
- **Games (issue #4, T-113/T-115):** see the [batch handoff](../games/batches/2026-11-15-english-input.md): English copy, input hardening (Rhythm, Secret Message, Mirror Grid, Tangram), new touch specs.
- **Verification:** `pnpm check`, 285 unit tests, `check:films` (105), `check:manifests`, `test:assets`, 29 report tests, production build, and the full serial Playwright suite on all four projects (results in the PR).
- **After merge:** deploy, then `pnpm db:refresh-demo` from the main checkout with the deployed env so the shared demo gets the films; tag `pre-redesign`. Old jury families may still show Russian feed titles saved by earlier builds until they expire.
- **Next:** T-62/T-84 physical iPad rehearsal (Web Audio mouth, touch input), T-114 next game wave (Shape Detective + Pattern Train), T-74 freeze.
