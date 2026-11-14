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
**Jury-ready presentation MVP:** one-tap isolated family access, quiz-first or simple signup, paired devices, saved learning/tasks/rewards and playable Snake. Activity analytics use real saved actions; historical/character radars and rankings remain labelled demo. See [demo.md](../demo.md) and the [remaining road map](todo.md#road-to-mvp-acceptance-criteria--remaining-tasks).

## Handoff
- **Latest (T-107–T-109):** `/` offers parent/child/jury roles. Demo-only jury creation gives each visitor an isolated family, generated reusable credentials, parent access and a nine-game history. `/jury` leads to both roles. Families older than seven days are pruned on jury creation. Settings has a parent-checked content reset. D-29 records persistence and limits.
- **Signup/setup (T-53/T-63 complete):** `/onboarding` remains quiz-first; `/signup` uses neutral answers. Both end at `/onboarding/setup` with pairing, current-domain Screen Time instructions and child/parent choices. Physical allowlist verification is still T-62.
- **Live loop:** recommendations receive the last seven days of completed sessions. Learning finishes automatically complete assigned app tasks and pay their stars once. Analytics calculate learning/science minutes, streak, weekly suns, entry advice rate and recommended start/finish counts. Brainy's suggestion only targets learning body stats.
- **Earned rewards:** named core thresholds, dashed-card progress, child celebration and parent event. Jury game ten unlocks the badge; the shared demo's existing backpack/badge are supported by its stats/history, with the garden one learning day away. Rules: [mechanics](../product/mechanics.md#accessories).
- **Leisure:** React Snake under `/fun/snake`, with saved active-play credit, top-ups and forever ownership; no learning rewards. Bought cartoon placeholders under `/cartoon/[id]` restart at zero with explicit play and no next-content suggestions. Other fun titles remain previews. Science media remains deferred.
- **Verification:** `pnpm check` and all 169 workspace unit tests pass. Full browser suite: 226/228 initially passed; fixed a lab board-read race and WebKit reload aborting game-route prefetch (game cards now load on selection). All 44 affected checks then passed on the final build across Chromium/WebKit, phone and landscape iPad. Reviewed WebKit jury/setup/reward/analytics/Snake screenshots. No known failing check remains.
- **Game ownership:** the separate `games` worktree/session owns learning runtimes/catalog/adapters. This session did not edit those paths. Master retains the D-28 Picture Puzzle/bridge baseline; coordinate incoming game changes before refreshing recordings.
- **Next:** refresh MVP/learning recordings on a fresh DB, coordinate T-104 English/T-105 Tangram work, rehearse physical iPad/Screen Time (T-62/T-84), then pitch and freeze (T-73/T-74). T-87 motion is optional. No deployment (T-14) this session.
- **Run:** `pnpm demo` resets the updated schema (new `game_sessions.recommended` flag), then open `/` → jury. Shared demo login `mama@example.com` / `demo1234`, PIN `1234`. Content reset preserves balances/progress/history; a new jury family gives a fresh badge rehearsal. Stale route types: delete `apps/web/.next/dev`. Optional `BRAINEE_NEXT_DIR` isolates build output during concurrent verification.
- **Limits:** illustrative radar history/character/ranking and placeholder media are labelled; referral has no backend attribution. Fun analytics are not collected, and abrupt close can lose one usage heartbeat. Pairing rate limits still use the local shared bucket. No infrastructure or deployment added.
