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
- **Game platform (T-19/T-29/T-85/T-89/T-90):** protocol 2/1 bridge, Phaser kit, Picture Puzzle, manifest-driven catalog/seed, own-origin build/asset checks and all-game conformance are complete. The puzzle reports four placements per issued session; existing server receipts grant rewards. Details and limits: [games.md](../dev/games.md#implemented-platform-slice-t-29--t-85--t-89--t-90), D-28.
- **Games next:** optional T-105 Tangram Tales via pinned path C; T-104 for English content; T-106 for a GDevelop export kit. Refresh recordings and rehearse on a physical iPad before freeze. No deployment.
- **Latest (T-103 complete):** parent Settings edits child details/promise, PIN and timezone; lists/revokes device sessions; creates one-time pairing codes for `/child-login`; shows account/logout and a static demo plan. Parent mutations check server-side elevation. Adult arithmetic fallback, child stage celebration + parent event, Russian task dates and empty-state shortcuts are included.
- **Onboarding:** quiz-first contract preserved; progress/back, answer reactions, Scroll Monster story, starting-Brainy reveal with hold (tap for reduced motion), optional referral field. Signup sends the browser timezone. The referral field has no backend attribution/reward yet.
- **Calendar/devices:** NY is the new default; Settings offers eleven zones. Existing saved zones remain until changed. [D-27](../dev/decisions.md) supersedes the D-26 default and records pairing persistence/limits; [mechanics](../product/mechanics.md#calendar-resets) documents immediate rollover. Two small SQLite tables hold private pairing data; child promise/calendar stay in showcase JSON.
- **Verification:** check and all 159 workspace unit tests passed; 28 final-build Settings/onboarding/calendar checks passed on Chromium/WebKit, phone and landscape iPad. Full browser run: 215/216 passed; the remaining WebKit lab readiness race was fixed with an awaited cell count, then all 8 lab cases passed. WebKit screenshots reviewed. An optional `BRAINEE_NEXT_DIR` isolates build output when another session is verifying games.
- **Related game work:** committed separately as `286021c`; asset audit and game WebKit screenshots verified by that session. The combined working tree was used for the checks above.
- **Next:** T-104 English locale and T-105 Tangram Tales. Refresh MVP/learning recordings on a fresh DB; T-62/T-84 physical iPad rehearsal, T-73 pitch and T-74 freeze follow. T-87 motion is optional; T-14 deployment remains deferred.
- **Run:** `pnpm demo` resets the updated schema and starts demo mode; child `/entry`, parent PIN 1234, login `mama@example.com` / `demo1234`, new family `/onboarding`, pairing `/child-login`. Use a full DB reset for a fresh bonus rehearsal; content reset preserves wallet/progress/calendar eligibility. Stale route types: delete `apps/web/.next/dev`.
- **Limits:** analytics remain labelled demo data; science media is on hold; fun games/cartoons demonstrate purchases only. Local pairing attempts share a rate-limit bucket; trusted per-address deployment handling belongs to T-82/T-14. No service or deployment added. No implementation blocker.
