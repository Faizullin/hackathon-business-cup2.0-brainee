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
- **PR #10 (branch `minor_features/placeholders_sound`, merged with current master):** Rhythm Copycat and Secret Message Lab now start with «Sound: on» and unlock WebAudio on the first gesture; Secret Message's toggle used to change only its label and now drives synthesized stamp/correct/mistake/finish cues. Placeholder content is gone per D-39: cartoons (cards, `/cartoon/[id]`, `buy-cartoon`, showcase field), the timer-based `DemoPlayer` and the four science entries without films, and the four unplayable fun titles. Leisure = Snake shop + the three films; `/video/[id]` renders not-found for non-film ids.
- **Existing families:** `syncCatalog` now drops saved `science`/`fun` items that the catalog no longer has (progress on removed placeholders is discarded); old `cartoons` JSON is ignored.
- **Passed:** `pnpm check`, 340 unit tests, production build; Playwright mvp-pages/own-origin/jury/film on webkit-ipad + chromium-phone (20/20 after fixing one new locator), state-sync 5/5, Rhythm/Secret Message integration/input/acceptance on webkit-ipad (11/11). Not run: full `pnpm e2e:full`, report regeneration.
- **Note:** with the app's `loading.tsx`, Next.js returns HTTP 200 for `notFound()` in `/video/[id]` (the not-found page still renders); the spec checks the page, not the status.
- **Next:** owner review/merge of #10; then the #8 follow-ups (physical iPad touch check, T-147, T-148, T-139).
