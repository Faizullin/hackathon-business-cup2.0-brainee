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
**Lavender redesign and parent funnel** per [plans/redesign.md](../plans/redesign.md) (T-130–T-142, D-34/D-35/D-36; visuals from [product/design.md](../product/design.md)), after the PR #1 films integration (issue #5). Games continue separately (issue #4). The jury-ready MVP stays working throughout: see [demo.md](../demo.md).

## Handoff
- **Latest (design reference, docs only):** read the owner's Claude Design artifact; frozen key files in `docs/ideas/claude-design/`; spec [product/design.md](../product/design.md) (tokens, motion, Brain component → Brainy mapping, kid-safe states, screen patterns, game palette); D-36; plan adds T-140–T-142 and unblocks T-138. Start with T-130 → T-133 → T-131 → T-132.
- **Earlier (planning, docs only):** analysed the Brainy Funnel Export → [product/funnel.md](../product/funnel.md) (screenshots, logic, tokens, mapping onto `quizStart`); plan [plans/redesign.md](../plans/redesign.md); D-34 English-only new work, D-35 funnel at `/start`. Next: T-130 → T-137 in order; T-138 waits for the AppLavender child/parent designs. No code changed in this session.
- **Previous games integration (still relevant) · Integrated:** pushed `games` commit `dc84a8b661409015d5dbae0d100cdfdd37d258e9` into master. The newer local-only cleanup commit was deliberately excluded. No other worktree was modified; no push, deployment or production database access.
- **Catalog:** Tangram Tales, Mirror Grid, Rhythm Copycat and Secret Message Lab join the three existing learning games. Magnet Mission Lab and Neighborhood Route Planner are unscored Explore previews. Pinned artifacts, source hashes and LICENSE/CREDITS are unchanged. Unimported titles remain unregistered (T-114).
- **Integration fixes:** T-112 English manifest titles, localized host loading/errors and iframe titles, locale handshake, Russian saved-feed titles. Explore direct opens now load shared state and honor age locks. The session API now enforces learning-game minimum ages. Core rewards, receipt replay protection, auth/pairing/PIN, settings, motion/offline recovery and production shared-family refresh logic remain intact.
- **Conflicts:** preserved master’s product handoff context and both ADRs; renamed the branch’s duplicate D-31 artifact decision to D-32. No application-code merge conflicts.
- **Build/checks:** production `pnpm build`, `pnpm check`, 172 unit tests, game build/hash/assets checks and 29 report-tool tests pass. Final phone-button CSS adjustment was rebuilt and asset-checked; its browser recheck remains pending.
- **Browser status — NOT a clean full suite:** invoked `pnpm e2e`, then split its 352 tests into four isolated browser/viewport runs for speed. At the owner’s repeated request to build/merge immediately, stopped those runs: 194 passed, 6 failed, 4 interrupted, 148 not run. Failures: transient duplicate React game locator in Chromium; WebKit Tangram lab selection/check, Mirror Grid lab finish, and Secret Message input completion. Earlier WebKit Rhythm stress also dropped inputs. Stationary hit areas and viewport-only game captures were added, but the complete serial rerun is still required. Do not attribute failures to parallelism without evidence or mark T-113 complete.
- **Coverage already exercised:** English/Russian surfaces, server age locks, own-origin loading, saved gains, history recommendations, parent updates, next-level/exit, timeout/reload recovery, jury/account/pairing/PIN, reduced motion and offline recovery. New-game English completion passes on Chromium; Tangram/Mirror/Rhythm also passed WebKit integration cases, while Secret Message remained intermittent. Earlier imported acceptance checks covered receipt replay; remaining matrix cases are not claimed complete.
- **Reports:** refreshed [learning](../reports/learning.md): 12 WebKit screenshots, phone/iPad videos, 27/27 checks per flow. Reviewed WebKit game screenshots; fixed clipped Secret Message phone controls. These recordings cover the native learning walkthrough, not complete imported-game acceptance.
- **Remaining:** T-113 serial input stabilization and full browser verification; T-115 English in-game instructions (catalog/host are bilingual, imported scored instructions remain Russian); T-114 further imports. Physical iPad rehearsal T-62/T-84 and final freeze T-74 remain open.
- **Delivery:** merge committed on master without co-author trailers. Redeployment and non-reset catalog seeding are needed to publish the new games, but resolve T-113 first. Do not reset production; no production data was modified here.
