# Status

> A snapshot: **overwrite it, don't append.** History goes in [log.md](log.md); tasks go in [todo.md](todo.md).

**Updated:** 2026-11-15 · **Phase:** P7 hackathon submission

## Phases

| # | Phase | Status | Tasks |
|---|---|---|---|
| P0 | Docs & planning | ✅ done | T-01 – T-05 |
| P1 | Scaffold monorepo + game pipeline | ✅ done for the presentation (T-17 generator, T-18 skills left) | T-10 – T-19 |
| P2 | Core logic + Brainy + game contract | ✅ done | T-20 – T-29 |
| P3 | Child flow | ✅ presentation scope done | T-30 – T-38 |
| P4 | Parent flow | ✅ presentation scope done | T-40 – T-46 |
| P5 | Data, auth, live sync | ✅ presentation scope done; full schema and real auth remain | T-50 – T-55 |
| P6 | PWA + allowlist on a real device | 🔄 manifest and network audit done; physical iPad next | T-60 – T-63 |
| P7 | Demo, pitch, deploy, submission | 🔄 deployed (T-14); submission cleanup done; deck, video and freeze left | T-70 – T-74, T-154 – T-158 |

Legend: ✅ done · 🔄 in progress · ⏳ next · ⬜ todo · ⛔ blocked

## Current focus
Hackathon submission. `master` contains PRs #9–#12 (game auto-discovery and thumbnails, placeholder removal and sound, the Brain Check funnel); the demo runs at `https://brainee.vercel.app`. Branch `chore/hackathon-submission` holds the submission cleanup (T-154) for review.

## Handoff
- **Branch `chore/hackathon-submission` (not pushed):** re-recorded reports with a scenario that walks the Brain Check funnel (MVP 22/22, learning 27/27 per device); `game-catalog` Node types so `pnpm check` passes; `pnpm dev` builds missing games and creates and seeds a missing local DB (`db:prepare`, never touches existing or remote data) and warns when `DEMO_MODE` is off; `docs/ideas` removed (map in [docs/README.md](../README.md#original-sources)); judge-facing README; architecture, setup and AGENTS describe the deployed build.
- **Verified this session:** `pnpm check`, all package unit tests, production build, report tooling tests; clean-start probe: missing DB → seeded on first run; a `db:push`-only DB has no game catalog (documented). Not run: `pnpm e2e:full` (T-139).
- **Owner decisions:** official submission rules, README Team and License (T-155); deck and narrated video (T-156); after judging `BRAINEE_LAB=0`, token rotation and the shared PIN (T-157); deleting merged remote branches and local worktrees (T-158).
- **Next:** owner reviews and merges this branch; `pnpm e2e:full`; physical iPad rehearsal (T-62/T-84); freeze and tag (T-74).
- **Env notes:** Windows CRLF working files: run `pnpm exec biome check --write <specific files>` only. `next dev` writes `apps/web/AGENTS.md`: delete it.
