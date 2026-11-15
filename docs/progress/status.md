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
Deployed hackathon build: first entry through the Brain Check funnel (quiet Jury shortcut kept), saved family logins, remote iframe games on R2 (D-42), deployed publishing with fast per-game tests, iPad surface scale.

## Handoff
- **Pushed to `origin/master` and deployed by Vercel** (2026-11-15): Sessions C (R2 remote games), D (iPad UI), F/F2 (no shared demo family without BRAINEE_SHARED_DEMO, D-43; logout → /login; saved logins; loading states; icon-only controls; shared player header) and G/G2 (`--target deployed` publishing to R2 + the production `games` table; `pnpm test:game <id>` / `pnpm test:games`; Tangram tap fix). No schema change, so no production DB migration.
- **Verified before push:** `pnpm check`, 379 unit tests, build, `pnpm test:games` 20/20. Earlier on the C/D merge: fast e2e 100/100, focused remote/card/layout specs 9/9; F: anonymous `/api/demo-session` 401 with the flag unset.
- **Owner next:** add the R2 variables and `REMOTE_GAMES_DRIVER=r2` in Vercel, redeploy, then publish the first remote game with `pnpm games:publish <build> --target deployed --yes`; run the full manual test pass; physical iPad check (T-62).
- **Env notes:** remote-game spec needs the local sample (`node scripts/prepare-remote-sample.mjs && pnpm games:publish .local/remote-shape-match --driver fs`). Windows CRLF: `pnpm exec biome check --write <specific files>` only. `next dev` writes `apps/web/AGENTS.md`: delete it.
