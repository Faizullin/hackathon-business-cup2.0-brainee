# Batch 2026-11-15: English-only platform and input stabilization

Issue: #4 (independent game integrations). Branch `feature/Independent_game_integrations`, worktree `../brainee-games`.

## 1. Commits and paths

- **Start:** `b1a3c68` (latest `origin/master`). **Final:** see `git log b1a3c68..HEAD` on the branch.
- **Owner direction during the batch:** the platform is **English-only**. Russian was removed from the games *and* the host UI. This replaces T-115 ("English in-game copy, keeping Russian"). The host change is outside this issue's game-only ownership and was explicitly requested by the owner.
- **Changed paths:**
  - Games: `games/{rhythm-copycat,secret-message-copy,reflection,tangram-tales}/{index.html,session.js}`, `games/reflection/session.css`, `games/{magnet-explorer,neighborhood-map-walk}/build.mjs`, `scripts/build-tangram.mjs`.
  - Host: `apps/web/src/i18n/*` (`ru.ts` deleted), `apps/web/src/components/LocaleSwitcher.tsx` (deleted) and its call sites, the Explore pages, `LearnContent`, `LearningProvider`, `AnalyticsScreen`, `LeisureScreen`, `RewardsScreen` (comment), `app/layout.tsx`.
  - Tests/tooling: `apps/web/e2e/*` (Russian assertions → English; `locale-switch.spec.ts` deleted; new `rhythm-copycat-input.spec.ts` and `secret-message-copy-input.spec.ts`), `apps/web/playwright.config.ts`, `turbo.json`, `scripts/report.mjs`.
  - Docs: `AGENTS.md` and `docs/dev/conventions.md`: one line each, so agents stop adding Russian UI.

## 2. Games fixed (no new games; scored vs preview unchanged)

| Game | Kind | Changes |
|---|---|---|
| Rhythm Copycat | scored | English copy. All demo/flash/transition timers are tracked and cleared on `pagehide`. Audio failures can't block input. `ready` is sent when the board is interactive (before the demo). `#game[data-turn]` = demo/player/feedback/done. |
| Secret Message Lab | scored | English copy. `data-turn` = preview/recall/feedback/done. Feedback timers cleared on `pagehide`. The e2e helper no longer races the preview timer. |
| Mirror Grid (`reflection`) | scored | English copy. **Input:** dot buttons are created once and only repositioned (each tap used to rebuild them all). The duplicate EaselJS click path and the 30 fps ticker are gone. Press feedback no longer shrinks the hit area. Buttons never overlap neighbours. **Double tap:** a solved pattern is shown for 700 ms, and Check is ignored meanwhile (before, a second tap graded the next, empty pattern as a mistake). |
| Tangram Tales | scored | The upstream English copy is kept (the build no longer translates it). Same 700 ms double-tap guard on Check; `#game[data-turn]`. |
| Magnet Mission Lab, Neighborhood Route Planner | preview | Host badge/exit in English ("Free play · no stars", "Exit"). |

The scoring rules are unchanged: one finish, `roundsPerSession` 4, each committed wrong Check counts one mistake (as `tangram.spec.ts` already asserts), and leaving midway reports nothing.

## 3. Verified in isolation vs through the product

- **Game contract only (lab, event stream):** the new touch specs run with `hasTouch` and real `tap()`. Rhythm: fast consecutive taps register once each over 4 level-3 rounds; taps during the demo never count. Secret Message: stamps, slot removal, overfill ignored, a double-tapped Check advances once.
- **Through the product (rewards via host):** `imported-game-acceptance` (mistake → correction → one saved reward → receipt replay), `games-integration` (gains, parent progress, recommendations, next level, timeout recovery), `tangram.spec.ts`, `english.spec.ts` (no Cyrillic on child/parent pages, including with a stale `brainee_locale=ru` cookie; every embedded game and preview is `lang="en"` with no Cyrillic).

## 4. Commands and results

Serial runs in the isolated worktree (`BRAINEE_NEXT_DIR=.next-games`, `BRAINEE_E2E_PORT=3114`, temp SQLite per run):

| Command | Result |
|---|---|
| `pnpm check` | pass |
| `pnpm test` | 172 passed |
| `pnpm games:build`, `pnpm check:manifests`, `pnpm test:assets` | pass (7 learning manifests, 2 previews, hashes + built assets) |
| `pnpm test:reports` | 29 passed |
| Full Playwright suite, one project at a time | webkit-ipad 87/90, webkit-phone 87/90, chromium-ipad 89/90, chromium-phone 89/90 |
| Re-run of the failing specs after fixes (`english`, `mvp-pages`, `onboarding`) | 13/13 on each of the four projects |

The first-pass failures were test-conversion mistakes and one real leftover, all fixed: the onboarding filter `hasNotText: "Back"` also matched the answer "Argues, but gives it back"; the gifts goal names the seeded prize "Movie night out"; Picture Puzzle still served `lang="ru"` and a Russian `<title>`. The earlier intermittent duplicate `odd-one-out` locator did not recur in the full runs.

## 5. Change requests (for the integrator)

- **ADR:** recorded as **D-34 · English-only platform** on the combined branch `feature/english-games-and-films`, which also removes the RU→EN content map, narrows the bridge `LOCALES` to `["en"]` and removes the Russian `docs/ideas/` sources.
- **Docs (done on the combined branch):** `docs/dev/games.md` (Tangram "Russian HTML", "imported instructions are Russian", RU feed titles), `docs/dev/decisions.md` (locale ADR), `docs/reports/README.md`, `docs/product/*` (Russian UI quotes), `docs/progress/*` (T-104/T-111/T-115 wording). T-115 should be closed as "English-only" rather than bilingual.
- **Report tool:** `scripts/report.mjs` now defaults to `en`/`en-US`. The `--locale-cookie` flag is now a no-op and could be removed from `scripts/reports/web.mjs`.
- **Catalog/build scripts, bridge:** no changes needed.

## 6. Sources, licenses, checksums

No new upstream sources. Pinned `artifact/` bytes, `sources.lock.json`, LICENSE and CREDITS are unchanged (`pnpm check:manifests` validates the hashes). Only wrappers and build transforms changed.

## 7. Risks and next batch

- The host UI was converted mechanically from the RU→EN dictionary pairs. A Russian string typed by a parent and saved in the production DB still shows as written.
- T-114 next wave (at most two games): Shape Detective + Pattern Train, English-only from the start.
- Physical iPad check (T-62/T-84) is still needed. These are WebKit-engine results, not Safari on a device.
