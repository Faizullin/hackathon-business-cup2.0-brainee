# AGENTS.md

The single source of instructions for AI coding agents. `CLAUDE.md` and `GEMINI.md` only import this file, so edit it here.

**Project:** Brainy (Brainee), a kids' learning PWA with a growing mascot and a two-currency reward economy. Summary: [README.md](README.md).

## Session protocol

**At the start** (keep it cheap, don't read the whole docs tree):
1. Read [docs/progress/status.md](docs/progress/status.md): current phase, focus and handoff note.
2. Find your task in [docs/progress/todo.md](docs/progress/todo.md).
3. Open only the docs that task needs. Use the "Read when" column in [docs/README.md](docs/README.md).
4. If a gitignored `.local/` folder exists, read `.local/README.md`: personal preferences and notes. Never commit it or copy its contents into tracked files.

**At the end** (or before you run out of context):
1. Tick finished items in `todo.md` and add any new items you found.
2. Overwrite the **Handoff** section of `status.md`: what changed, what's next, blockers.
3. Add one short dated entry at the top of [docs/progress/log.md](docs/progress/log.md).
4. If you made an architectural choice, add an entry to [docs/dev/decisions.md](docs/dev/decisions.md).

## Token rules

- The original PRD and prototype are no longer in the tree; their content lives in [docs/product/](docs/product/) ([docs/README.md § Original sources](docs/README.md#original-sources) explains where).
- Each fact lives in one doc. Link to it; don't copy it. Update the original when it changes.
- Keep docs in English. The product UI, including games and films, is English-only (D-34).

## Hard rules (break these and the product breaks)

- **Everything loads from our own domain or its subdomains.** That includes the API, auth, fonts, images, video and games. No third-party CDNs, no YouTube embeds, no client calls to `*.supabase.co` or Firebase. The iOS Screen Time allowlist blocks them. → [rules.md](docs/product/rules.md#technical-requirements)
- **Game rules live in `packages/core`** as pure, tested functions. Don't scatter economy or stat logic through UI code. → [architecture.md](docs/dev/architecture.md)
- **Games follow the contract**: React games through props, any other engine (Phaser, GDevelop, external repo) through the iframe bridge. They report a `GameResult`, never grant ★, and load nothing from outside our origin. Test them at `/lab`. Port the bridge, engine kits and tests from `../game-store-planning` rather than rewriting them. → [games.md](docs/dev/games.md)
- **Local-first, no new infrastructure.** SQLite file, media in `public/media`. D-42 allows remote game artifacts only in R2 through same-origin `/g/` routes; built-in games/media stay in the repo. Remote frames must use `sandbox="allow-scripts"` and the response CSP sandbox. Don't assume a long-running process or writable disk (the deploy is serverless: Vercel + Turso, live at `brainee.vercel.app`; live sync = polling). Never run scripts against the cloud DB without the owner's go-ahead. Don't add backend services, cloud SDKs, auth or payment providers without a new entry in [decisions.md](docs/dev/decisions.md).
- **English-only platform (D-34):** host, games and films use English with no locale controls or locale cookie. Keep new feature text in feature-local English copy modules. No Russian in new code, docs, prompts or tests. → [decisions.md](docs/dev/decisions.md)
- **Redesign:** follow [docs/plans/redesign.md](docs/plans/redesign.md). The visual source of truth is [docs/product/design.md](docs/product/design.md) (D-36), with the funnel in [docs/product/funnel.md](docs/product/funnel.md) (D-35). Brainy is a port of the design's Brain component driven by our stats and mood, kid-safe (no rot, stink or flies) everywhere except the parent funnel at `/start`, where `effects="full"` is allowed as a marketing device (D-40). The funnel offer shows real prices but takes no payment (D-41). Don't add real checkout, a payment provider or third-party analytics.
- **Product rules:** no feeds, autoplay or "watch next". Kids never see rankings. Brainy never dies. No medical claims. → [rules.md](docs/product/rules.md#product-rules)

- **Keep tests short.** Use `pnpm e2e` (the fast core run) for everyday work. Run `pnpm e2e:full` only for game work or a release. Don't add specs that duplicate existing coverage or re-run stable checks on every project; put new heavy game specs in `HEAVY_GAME_SPECS`. Never edit the Playwright config while a run is in progress.

## Commands

- `pnpm install` — install the workspace using the pinned package manager and lockfile.
- `pnpm demo` — **manual run**: reset the demo DB, then `pnpm dev` with `DEMO_MODE=1 BRAINEE_LAB=1` at `http://localhost:3000` (parent PIN `1234`).
- `pnpm dev` — build missing games, create and seed a missing local DB, then start the Next.js web app at `http://localhost:3000` (child/parent data need `DEMO_MODE=1`, via env or `apps/web/.env.local`).
- `pnpm build` / `pnpm start` — build and serve the production web app.
- `pnpm e2e` — build, then the fast core browser run (WebKit iPad flows + one game per runtime, Chromium phone layout). `pnpm e2e:full` adds every game check and size; use it for game work and releases. Tiers: [setup.md](docs/dev/setup.md#e2e-matrix-tiered).
- `pnpm report --video` — generate Markdown with phone/iPad recordings, screenshots and logs against a local server; see [docs/reports/README.md](docs/reports/README.md).
- `pnpm test:reports` — validate the report generator, browser capture, video conversion and artifact links.
- `pnpm test:game <id>` / `pnpm test:games` — isolated embedded game checks on iPad/phone, without Next or DB; `--dir <folder>` checks a remote build.
- `pnpm test` — run workspace Vitest tests (`core` rules, game rounds, database).
- `pnpm db:reset` — recreate the local SQLite database, push the schema and seed the demo.
- `pnpm db:push` / `pnpm db:seed` / `pnpm db:studio` — apply the schema, add demo fixtures or inspect local data.
- `pnpm check:films` — validate every film in `apps/web/public/media/films` (script rules, art, mp3, catalog); podcast → film workflow in [films.md](docs/dev/films.md).
- `pnpm check` — Biome lint/format checks, `check:games` (self-contained game folders), then TypeScript checks.
- `/lab` (in `pnpm dev`) — play any registered game with level/seed and watch its events; `/lab/brainy` — Brainy presets, stat sliders, accessories.
- `pnpm typecheck` — workspace TypeScript checks through Turborepo.
- `pnpm format` — format source and config files with Biome.

`pnpm games:publish <folder|zip|id> --target local|deployed` publishes or manages remote versions (D-42; [author guide](docs/dev/games.md#remote-games-r2)).

`pnpm games:build` bundles same-origin embedded games (games register from their own folders via `pnpm games:discover`); `pnpm test:assets` validates their builds. Database paths, browser installation and all commands are in [docs/dev/setup.md](docs/dev/setup.md).

## Conventions and tools

- [docs/dev/conventions.md](docs/dev/conventions.md). **Workflow: feature branch → PR into `master`**, Conventional Commits with task IDs. Personal workflow preferences live in `.local/`.
- Skills to use or skip: [docs/dev/agent-tooling.md](docs/dev/agent-tooling.md). UI work follows [docs/dev/ui.md](docs/dev/ui.md): Base UI components via shadcn, prototype tokens, and the lightest motion layer that works; don't invent a new visual style.
- After UI changes: render the page, check phone and iPad widths, run the Playwright spec.
