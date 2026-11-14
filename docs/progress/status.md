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
- **Completed T-110 verification / production demo refresh:** T-110 was already committed at session start. Refreshed only the deployed shared demo family with `db:refresh-demo`; verified `mom@example.com` / `demo1234` against that database and confirmed other family IDs were preserved. No deployment or push performed; credentials/environment values were not logged or committed.
- **T-111 / D-31:** English WebKit MVP and learning reports, English child/game/parent smoke and a Russian seed-content smoke. Localized Brainy labels through the web wrapper, own lab UI, fictional ranking names and the post-game practice title. The install manifest is English. Report reset now authenticates the parent, uses the locale cookie and New York time, and avoids mobile WebKit's unsupported wheel input.
- **T-87:** finite star flight to the post-game wallet, animated confirmed counters, two idle breaths, stage entrance and localized Brainy loading/error screens. Reduced motion removes movement and updates values immediately. No economy changes.
- **Offline recovery:** browser connection events show a friendly notice even when query polling pauses offline. Already loaded pages retain confirmed state and recover on reconnection. Cold opens/uncached routes still need a connection: no service worker or offline-play promise.
- **Demo/pitch:** [demo.md](../demo.md#physical-ipad-rehearsal-t-62--t-84--owner-checklist) has the physical iPad + phone checklist; [pitch.md](../pitch.md) supplies a ten-slide outline and three-minute US-first script (T-73). Owner assembles the deck. Physical allowlist/Add to Home Screen checks are not claimed complete.
- **Verification:** `pnpm check`, 170 workspace unit tests and 29 report-tool tests pass. The full browser run initially passed 228/236; failures exposed stale locale-toggle selectors, English manifest expectations and a WebKit navigation race, subsequently fixed and covered by targeted reruns. Final focused run: 36/36 across Chromium/WebKit, phone 390×844 and iPad 1180×820 (English/Russian, full game finish, normal/reduced motion, offline recovery, polling and session expiry). Fresh-demo state-sync now allows the extra version written by a newly earned reward; replay/stop assertions remain strict. WebKit phone/iPad screenshots and report video frames reviewed. Full suite was not rerun in its entirety after these fixes.
- **Reports:** [MVP](../reports/mvp.md) and [learning](../reports/learning.md) are English WebKit captures from fresh local databases. WebKit cannot generate Chromium-only PDF output; PNG, HTML and MP4 evidence is available. Historical/character radars and rankings remain labelled demo; video media remains placeholder.
- **Games-session handoff — T-112:** translate English manifest titles and GameHost/IframeGame strings (the reviewed phone video still briefly shows «Загружаем игру…»); retain Russian support and own-origin loading. Main-product callers currently translate known catalog titles through `content.ts`. No protected game package, game artifact, other worktree or games branch was edited, inspected or merged in this session.
- **Next:** owner redeploys these committed changes, performs T-62/T-84 physical rehearsal and supplies results; games session finishes T-112/catalog work independently. T-74 freeze/tag follows the owner-confirmed games merge and rehearsal. Do not merge or inspect games worktrees from a main-product session.
- **Run:** `pnpm demo`; shared demo login `mom@example.com` / `demo1234`, PIN `1234`. A fresh jury family provides a live tenth-game badge unlock. Reusing Settings reset preserves progress/earned rewards.
- **Delivery:** small commits on `master`, no co-author trailers; not pushed. **Redeploy required** to expose the UI/report-related application changes. The production demo data refresh is already applied.
