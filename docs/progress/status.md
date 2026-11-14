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
**Lavender redesign only**, per [plans/redesign.md](../plans/redesign.md). Prioritize iPad screenshot review while retaining the Chromium/WebKit phone/iPad test matrix. Review corrections are verified; continue the remaining tasks in order.

## Handoff
- **T-142 done:** compact Today Energy/status and sessions, attention actions, selectable Week bars, grouped source feed and an honest recent-event wallet breakdown. Pure core reporting helpers are tested. Check/test/build pass; 68 affected browser cases pass on both engines/sizes. Parent phone/iPad screenshots reviewed. Saved-cover resume regression also fixed and verified.
- **T-138 done:** dark entry and break cards, reward bubble/gain motion, compact post-game columns, leisure time explainer, quest rows and shop/settings surfaces. Check/test/build pass; 64 affected cases plus final 16-case visual verification pass. Phone/iPad screenshots reviewed; corrected entry/locale overlap.
- **T-137 done:** funnel-local shape match and five-stage growth preview with pure core helpers, no network writes/sessions/rewards. Check/test/build and 20 affected browser cases pass; phone/iPad screenshots reviewed.
- **T-136 done:** validated JSON family plan at signup, parent-only edits/download/copy, child stopping phrase and an off-screen task template. Pure rules and persistence tests pass; browser matrix is 24 existing cases plus 4 corrected English family-plan cases. Initial family tests used a Russian-only helper; corrected locally without game changes.
- **T-135 done:** 25-step parent funnel, resume/migration, early age exit, tour/angle support and validated signup into setup. Check/test/build and final 20-case matrix pass; earlier 32-case matrix also covers the jury shortcut. Phone/iPad screenshots reviewed.
- **Review feedback fixed:** dedicated accent/highlight roles, coral audit, compact dark Energy summaries, Learn greeting/skill icons, Path badges, 44 px parent tabs and one host progress indicator. Check/test/build and 92 affected Chromium/WebKit phone/iPad cases pass; all 11 requested pages reviewed at both sizes.
- **Done:** T-133 funnel core; T-131 tokens/fonts/icons/motion; T-132 reference Brain port, kid-safe energy/stats/accessories and shared visible-hero ticker; T-134 step/answer components; T-140 dark heroes, hub/rail and Path; T-141 game palette and host chrome. Each has a small commit on master.
- **Verified:** pnpm check, pnpm test and builds pass. Affected browser matrices: T-131 56/56, T-132 60/60, T-134 4/4, T-140 60/60, T-141 24/24 plus 4/4 loaded-game visual captures. iPad screenshots reviewed. Initial T-132 stale test selectors were corrected and rerun; T-134 native progress styling was corrected after screenshot review.
- **Next:** T-139 final full serial suite, docs and recordings. `/onboarding` now redirects to `/start`; funnel signup reaches setup.
- **Not yet verified:** final full serial pnpm e2e and refreshed MVP/learning recordings. These remain required after the remaining redesign tasks; focused passes are not a full-suite claim. New host styling has not had a complete imported-game matrix.
- **Scope:** existing translation files and game internals untouched. No push, deployment or production data access. Redeploy only when the completed redesign is ready to publish.
