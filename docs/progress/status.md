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
Hackathon submission build on `master`, now with remote iframe games on R2 (D-42) and the iPad surface scale with shared game card media. The demo runs at `https://brainee.vercel.app` (not yet redeployed with these changes). Next: authentication and onboarding fixes, then redeploy.

## Handoff
- **Merged locally into `master` (not pushed):** `feature/r2-remote-games` (T-91: `pnpm games:publish`, fs/R2 drivers under the `brainy/` prefix, same-origin `/g/<id>/<version>/` proxy, opaque `allow-scripts` sandbox, live catalog in Learn/Explore) and `feature/ipad-ui-thumbnails` (T-159: tablet type and rhythm, 48/56 px controls, `GameCardMedia`). Merges had no textual conflicts; the only integration fix was the game-cards spec accepting versioned `/g/` thumbnails.
- **Verified on the merged tree:** `pnpm check`, 367 unit tests + 2 publisher tests, production build, fast `pnpm e2e` 100/100, focused remote-game + game-cards + layout specs 9/9 (remote sample published with the local fs driver). Full serial suite 211/211 ran before the merge (T-139). Reports re-recorded after the merge.
- **Next:** auth/onboarding fixes (anonymous visitors join the shared demo family; credentials kept only in sessionStorage; incomplete loading states; Jury entry too prominent); then owner adds the R2 variables to Vercel and redeploys; physical iPad check (T-62).
- **Env notes:** remote-game spec skips unless the sample is published (`node scripts/prepare-remote-sample.mjs && pnpm games:publish .local/remote-shape-match --driver fs`). Windows CRLF: `pnpm exec biome check --write <specific files>` only. `next dev` writes `apps/web/AGENTS.md`: delete it.
