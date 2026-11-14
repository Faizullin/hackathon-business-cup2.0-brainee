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
- **Integration complete:** resolved all 32 merge conflicts. Retained lavender tokens, compact Energy cards, Path, parent Today/Week, `/start` and family plans. Brainy keeps its reference renderer and gains tested, clamped `talk` input for film narration; film controls remain explicit-play and pause-only.
- **Language and decisions:** published D-33/D-34 retain their numbers; D-37 is superseded by D-34 and keeps the feature-local English copy rule. All 37 ADR numbers are unique. Locale UI/cookies and `BRAINEE_DEFAULT_LOCALE` are removed.
- **Passed:** `pnpm check`; **301 unit tests**; `pnpm check:films` (**105 tests**, already included in the unit total); manifest and built-asset checks (**7 learning games + 2 previews**); production build.
- **Browser evidence:** the owner shortened the full serial run after interruption. Its log records **95 passed, 2 failed, 311 without a result** out of 408. Both failures were the old loaded-font count (`Expected: >= 2`, `Received: 1`) on `/` and `/login`; the assertion now checks loaded Manrope directly. The subsequent **76 focused tests pass** across Chromium/WebKit at 390×844 and 1180×820, and the separate **WebKit iPad film spec passes 4/4**. No known failures remain in the executed checks; this is not a full-suite pass.
- **Visual review passed:** Learn, Leisure, a film, Brainy, Path, Gifts, `/start`, Analytics and Tasks at phone and iPad sizes against [design.md](../product/design.md). Captures from all four projects are preserved in `/tmp/brainee-merge-focused-results`; command logs are `/tmp/brainee-merge-*.log`.
- **Scope:** T-113/T-115 are done upstream; protected game paths match `origin/master` exactly. The main checkout was not edited. No push, deployment or production data access.
- **Left:** T-139 remains open for the combined build's full serial verification and refreshed recordings. Existing reports predate this integration. Owner follow-ups remain physical-device rehearsal and film voice/commercial-use notes (T-124).
