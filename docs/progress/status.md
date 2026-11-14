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
Isolated games batch on `games`, worktree `../brainee-games`. The owner explicitly requested no merge into master, no push and no deployment. Parent/auth/settings work remains owned by the other session.

## Handoff
- **Implemented:** four scored archive imports (Tangram Tales, Mirror Grid, Rhythm Copycat, Secret Message Lab) plus two unscored Explore previews (Neighborhood Route Planner, Magnet Explorer). Total platform registry: seven learning games and two previews. Pinned artifacts, licences and hashes are retained; build/runtime loads stay on our origin.
- **Learning:** four real completed tasks, failed-check mistakes, one correction per corrected task, one issued-session reward receipt; leaving stops without a finish. Preview entries have a separate schema and never issue/finish learning sessions or change wallet/skills.
- **iPad first:** landscape screenshots reviewed; fixed Neighborhood action visibility/pressed-button position and Rhythm mascot overlap. Lab tests explicitly select the tablet frame. Main implementation commit: `3b9527f`; follow-up commits record verification/documentation.
- **Verification:** static checks, 171 unit tests, game builds and asset/hash checks pass. Focused iPad game suite: 22 passed; revised iPad conformance/Rhythm suite: 10 passed; previews: 8 passed across Chromium/WebKit and phone/iPad. The full 308-case matrix was exercised across isolated browser runs. Twelve onboarding/login failures remain outside this task. Serial iPad stress rerun: 10 passed, 2 failed (Rhythm input and Tangram placement); these are unresolved, not proven to be parallel-run interference.
- **Known broader failures:** onboarding answer selectors include the new locale buttons; `/login` keyboard focus expectations predate the locale switch. These protected app areas and their tests remain unchanged in this branch.
- **Faster future imports:** preserve original English games in Explore with a small lifecycle/exit wrapper, then promote selected games using real attempt/completion hooks. Opens/time spent must not imply skill improvement. Code the Maze is the next recommended scored candidate; see [external-games.md](../product/external-games.md).
- **Next:** owner review on a physical iPad, optional English game chrome (T-112), remaining imports (T-114). Keep this worktree/branch separate. Finish the two intermittent input failures before declaring T-113 complete. [Focused iPad commands](../dev/setup.md#games-only-ipad-review); ignored screenshots/logs are under `.local/games-verification` in this worktree.
