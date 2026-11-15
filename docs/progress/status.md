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
- **This session (T-116, branch `minor_features/placeholders_sound`, uncommitted):** Rhythm Copycat and Secret Message Lab now start with sound on («Звук: вкл») and unlock WebAudio on the first gesture. Secret Message's toggle used to change only its label; it now drives synthesized stamp/correct/mistake/finish cues. Removed placeholder content per D-33: cartoon and science-video cards, `/cartoon/[id]`, `/video/[id]`, their core actions/showcase fields/seed, and non-Snake fun titles. Leisure is the Snake shop; analytics weekly bars lose the science series.
- **Verified:** 171 unit tests, `pnpm build`, `games:build`, `test:assets`, `check:games`; Playwright `mvp-pages`/`own-origin`/`jury` on chromium-phone + webkit-phone (20/20), and Rhythm/Secret Message conformance + acceptance on chromium-phone (8/8). The full `pnpm e2e` matrix was not run.
- **Tooling caveats:** `apps/web/.next-combined/` and `.next-films/` are committed build outputs; repo-wide `pnpm format`/`biome check .` rewrite or flag them, so `pnpm check` fails (T-117). Stale `apps/web/.next/dev/types` (old `/lab/film`, `/video`, `/cartoon` entries) blocked `next build`; it was moved to the session scratchpad and regenerates on the next `pnpm dev`.
- **Still open from before:** T-113 serial WebKit input stabilization + full browser rerun; T-115 English in-game instructions (now also the sound toggles); T-114 further imports; physical iPad rehearsal T-62/T-84 and freeze T-74. Production needs a redeploy; existing families keep old cartoon/science JSON, which is ignored.
