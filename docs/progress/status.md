# Status

> A snapshot: **overwrite it, don't append.** History goes in [log.md](log.md); tasks go in [todo.md](todo.md).

**Updated:** 2026-11-15 · **Phase:** P7 hackathon submission

## Phases

| # | Phase | Status | Tasks |
|---|---|---|---|
| P0 | Docs & planning | ✅ done | T-01 – T-05 |
| P1 | Scaffold monorepo + game pipeline | ✅ done | T-10 – T-19 |
| P2 | Core logic + Brainy + game contract | ✅ done | T-20 – T-29 |
| P3 | Child flow | ✅ presentation scope done | T-30 – T-38 |
| P4 | Parent flow | ✅ presentation scope done | T-40 – T-46 |
| P5 | Data, auth, live sync | ✅ done for the hackathon | T-50 – T-55 |
| P6 | PWA + allowlist on a real device | ✅ done for the hackathon | T-60 – T-63 |
| P7 | Demo, deploy, submission | ✅ deployed (T-14) and submission cleanup merged (T-154) | T-70 – T-74, T-154 |

Legend: ✅ done · 🔄 in progress · ⏳ next · ⬜ todo · ⛔ blocked

## Current focus
Hackathon submission build on `master`: PRs #9–#12 plus the submission cleanup (T-154). The demo runs at `https://brainee.vercel.app`. Remaining work is listed under "After the hackathon" in [todo.md](todo.md).

## Handoff
- **Merged locally into `master` (not pushed):** re-recorded reports with the Brain Check funnel walk (MVP 22/22, learning 27/27 per device); `game-catalog` Node types so `pnpm check` passes; first `pnpm dev` builds missing games and creates and seeds a missing local DB (`db:prepare`); `docs/ideas` removed (map in [docs/README.md](../README.md#original-sources)); judge-facing README; architecture, setup and AGENTS describe the deployed build; presentation notes (pitch, jury script) moved out of the tree.
- **Verified:** `pnpm check`, 362 unit tests, production build, report tooling tests, first-run preparation on a fresh DB path.
- **Next:** push `master` when the owner asks; post-hackathon items in [todo.md](todo.md#after-the-hackathon).
- **Env notes:** Windows CRLF working files: run `pnpm exec biome check --write <specific files>` only. `next dev` writes `apps/web/AGENTS.md`: delete it.
