## Summary

Replaces the soft 25-screen `/start` routine guide with a short web2app sales quiz that ends in the app (T-149 to T-153).

- **Funnel (T-149):** 19 screens. Behaviour questions first, a live **brain meter** beside the question (health = mood, starts at 80, answer drains computed from the answers so Back stays correct), the result as the child's Brainy, "right on time", goals, the 5-stage solution, plan builder and an offer. Jury entry is in every header. Rules are pure and tested in `packages/core/src/funnel-quiz.ts`.
- **Routing (T-150):** `/` is a server gate (`/entry` on a device with a family, `/start` otherwise); the role picker stays at `/login`; `?reset=1` clears the quiz and the Starter Pack timer.
- **No-form start (T-151):** the offer shows real prices ($14.99 / $79.99, display only) with an honest 15-minute Starter Pack timer. `POST /api/onboarding/start` creates a family with generated credentials, the funnel health as the Brainy's starting mood, the chosen plan and gift, and the adapted family plan. Parent Settings has a "Your login" card.
- **Hero Cape (T-152):** exclusive `cape` accessory in a new `back` slot (never sold), drawn behind the body, plus a one-time full-screen "Starter Pack unlocked" moment on the first `/entry` visit (+100 ★, 150 total).
- **Docs and tests (T-153):** funnel.md rewritten; D-40 (full rot effects only in `/start`) and D-41 (real prices, no payment); workflow docs now describe feature branch → PR.

Product rules kept: no medical wording ("a playful indicator"), no invented testimonials (the parent quote is a placeholder), the stat has its source, everything loads from our own origin, child surfaces keep `effects="kid"` (an e2e test checks it).

## Screenshots

Desktop 1280×650 and phone 390×844, screens 1, 5, 11, 14, 19 and the unlock moment (files in `docs/progress/brain-check-funnel/`):

| | Desktop 1280×650 | Phone 390×844 |
|---|---|---|
| 1 `duration` | ![](https://github.com/Faizullin/hackathon-business-cup2.0-brainee/blob/feature/brain-check-funnel/docs/progress/brain-check-funnel/1280x650-duration.png?raw=true) | ![](https://github.com/Faizullin/hackathon-business-cup2.0-brainee/blob/feature/brain-check-funnel/docs/progress/brain-check-funnel/390x844-duration.png?raw=true) |
| 5 `reading` | ![](https://github.com/Faizullin/hackathon-business-cup2.0-brainee/blob/feature/brain-check-funnel/docs/progress/brain-check-funnel/1280x650-reading.png?raw=true) | ![](https://github.com/Faizullin/hackathon-business-cup2.0-brainee/blob/feature/brain-check-funnel/docs/progress/brain-check-funnel/390x844-reading.png?raw=true) |
| 11 `reveal` | ![](https://github.com/Faizullin/hackathon-business-cup2.0-brainee/blob/feature/brain-check-funnel/docs/progress/brain-check-funnel/1280x650-reveal.png?raw=true) | ![](https://github.com/Faizullin/hackathon-business-cup2.0-brainee/blob/feature/brain-check-funnel/docs/progress/brain-check-funnel/390x844-reveal.png?raw=true) |
| 14 `solution` | ![](https://github.com/Faizullin/hackathon-business-cup2.0-brainee/blob/feature/brain-check-funnel/docs/progress/brain-check-funnel/1280x650-solution.png?raw=true) | ![](https://github.com/Faizullin/hackathon-business-cup2.0-brainee/blob/feature/brain-check-funnel/docs/progress/brain-check-funnel/390x844-solution.png?raw=true) |
| 19 `offer` | ![](https://github.com/Faizullin/hackathon-business-cup2.0-brainee/blob/feature/brain-check-funnel/docs/progress/brain-check-funnel/1280x650-offer.png?raw=true) | ![](https://github.com/Faizullin/hackathon-business-cup2.0-brainee/blob/feature/brain-check-funnel/docs/progress/brain-check-funnel/390x844-offer.png?raw=true) |
| unlock | ![](https://github.com/Faizullin/hackathon-business-cup2.0-brainee/blob/feature/brain-check-funnel/docs/progress/brain-check-funnel/1280x650-unlock.png?raw=true) | ![](https://github.com/Faizullin/hackathon-business-cup2.0-brainee/blob/feature/brain-check-funnel/docs/progress/brain-check-funnel/390x844-unlock.png?raw=true) |

## Test results

- Unit (Vitest): core 105, brainy 12 pass; db funnel-store 3 pass (other db suites print Windows EBUSY temp-file cleanup noise, assertions pass).
- Lint: `biome check` on every file changed in the branch passes (repo-wide check shows CRLF noise on this Windows checkout).
- Build: `pnpm build` ok.
- Playwright fast tier (`pnpm e2e`): 91 passed. Failures: tangram (4) and lab seed replay on webkit-ipad (games, untouched), and `/login` keyboard-focus check on webkit-ipad (untouched). A login test timeout was a flake and passed on rerun. The new brain-check spec, funnel-moments, onboarding, jury, family-plan and own-origin pass.
- Layout sweep: all 19 screens fit without clipping at 1280x650, 1366x680, 1440x780, 1920x960 and 1180x820, no sideways scroll at 390x844 and 360x740.
- Not run: `pnpm e2e:full`, report regeneration.

## Notes for review

- "Notify me" on the age-Other exit screen stores the email only in the browser; nothing is sent (no backend collects it yet).
- Plan, gift, minutes per day and the "earn screen time" answer live in `showcase.startPlan` (no other place existed).
- The Windows checkout here has CRLF working files, so a repo-wide `biome check` reports line-ending noise; the files changed on this branch pass `biome check`.
- Not run: `pnpm e2e:full`, report regeneration.
