# Status

> A snapshot: **overwrite it, don't append.** History goes in [log.md](log.md); tasks go in [todo.md](todo.md).

**Updated:** 2026-11-14 · **Phase:** P7 Demo prep (all pages built)

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
**Presentation MVP: every page exists** (D-21). Child: entry, Learn with advice, three games and the post-game loop, Leisure, video quiz, Gifts, Brainy shop. Parent: PIN/adult gate, Analytics (seeded), Tasks, Gifts & goal, Settings/devices. Child ↔ parent sync works by polling. What's left before deployment: the [road map in todo.md](todo.md#road-to-mvp-acceptance-criteria--remaining-tasks).

## Handoff
- **Latest (T-107 complete, D-29):** podcasts become interactive films, an mp3 plus a JSON script drawn in the browser. The format and checks are in `core/film.ts`; art and the stage are in `packages/films`. `/video/<id>` plays a registered film (pause-only, questions pause the audio with hint, «Послушать ещё раз» and praise, minute-based resume) and ends on the unchanged +15★ quiz. `/lab/film` is the seekable studio. Workflow and rules: [films.md](../dev/films.md).
- **First film `sky-blue`** («Why Is the Sky Blue?», 12:34, from `videos/audio/ElevenLabs_…mp3`). **The podcast is in English**, so captions and questions are English and the player chrome is Russian. It has 8 questions (0:11, 4:41, 5:44, 7:07, 10:25, 11:18, 11:31, 11:45; the last three are the podcast's own mini-quiz), 83 scenes and 26 props. `pnpm check:films`: 0 errors, 0 warnings.
- **Verification:** `pnpm check` and 208 unit tests pass. The full e2e run passed 224/224 (Chromium/WebKit × phone/iPad), including the new `e2e/film.spec.ts` and `/video/sky-blue` + `/lab/film` in the own-origin audit. Scene screenshots were reviewed.
- **Run:** after pulling, `pnpm db:reset` (or `pnpm demo`) adds the `sky-blue` science card. Child: `/leisure` → «Why Is the Sky Blue?».
- **Notes:** `videos/` (the raw source mp3) is untracked on purpose; the shipped copy is `apps/web/public/media/films/sky-blue.mp3` (12 MB, not re-encoded). `next dev` now writes `apps/web/AGENTS.md`; that's Next's boilerplate, deleted, not committed.
- **Next:** T-108 film follow-ups; T-104 English locale; T-105 Tangram Tales; T-62/T-84 physical iPad rehearsal (including the film mouth), then T-73 pitch and T-74 freeze. T-14 deployment stays deferred.
- **Game platform (T-19/T-29/T-85/T-89/T-90), Settings (T-103):** complete. See D-27/D-28 and [games.md](../dev/games.md#implemented-platform-slice-t-29--t-85--t-89--t-90).
- **Run (demo):** `pnpm demo` resets the schema and starts demo mode; child `/entry`, parent PIN 1234, login `mama@example.com` / `demo1234`, new family `/onboarding`, pairing `/child-login`. Stale route types: delete `apps/web/.next/dev`. `BRAINEE_NEXT_DIR` isolates build output (set it on `next build`/`next start` directly; turbo's strict env drops it).
- **Limits:** analytics remain labelled demo data. Fun games and cartoons demonstrate purchases only; science videos other than `sky-blue` are still animated placeholders. No service or deployment was added. No implementation blocker.
