# AGENTS.md

The single source of instructions for AI coding agents. `CLAUDE.md` and `GEMINI.md` only import this file, so edit it here.

**Project:** Брейни, a kids' learning PWA with a growing mascot and a two-currency reward economy. Summary: [README.md](README.md).

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

- **Never read `docs/ideas/PRD Брейни.pdf`.** It's 24 pages of Russian, mostly images. Its content is condensed in [docs/product/](docs/product/).
- **Never read the whole prototype HTML** (~1,170 lines). Use the line map in [docs/ideas/README.md](docs/ideas/README.md) and read only the range you need.
- Each fact lives in one doc. Link to it; don't copy it. Update the original when it changes.
- Keep docs in English (cheaper in tokens than Russian). Quote UI strings in Russian.

## Hard rules (break these and the product breaks)

- **Everything loads from our own domain or its subdomains.** That includes the API, auth, fonts, images, video and games. No third-party CDNs, no YouTube embeds, no client calls to `*.supabase.co` or Firebase. The iOS Screen Time allowlist blocks them. → [rules.md](docs/product/rules.md#technical-requirements)
- **Game rules live in `packages/core`** as pure, tested functions. Don't scatter economy or stat logic through UI code. → [architecture.md](docs/dev/architecture.md)
- **Games follow the contract**: React games through props, any other engine (Phaser, GDevelop, external repo) through the iframe bridge. They report a `GameResult`, never grant ★, and load nothing from outside our origin. Test them at `/lab`. Port the bridge, engine kits and tests from `../game-store-planning` rather than rewriting them. → [games.md](docs/dev/games.md)
- **Local-first, no new infrastructure.** SQLite file, media in `public/media`. Don't assume a long-running process or writable disk (the final deploy is serverless; live sync = polling). Deployment is only the last task (T-14). Don't add backend services, cloud SDKs, auth or payment providers without a new entry in [decisions.md](docs/dev/decisions.md).
- **Product rules:** no feeds, autoplay or "watch next". Kids never see rankings. Brainy never dies. No medical claims. → [rules.md](docs/product/rules.md#product-rules)

## Commands

- `pnpm install` — install the workspace using the pinned package manager and lockfile.
- `pnpm demo` — **manual run**: reset the demo DB, then `pnpm dev` with `DEMO_MODE=1 BRAINEE_LAB=1` at `http://localhost:3000` (parent PIN `1234`).
- `pnpm dev` — start the Next.js web app at `http://localhost:3000` (child/parent data need `DEMO_MODE=1`, via env or `apps/web/.env.local`).
- `pnpm build` / `pnpm start` — build and serve the production web app.
- `pnpm e2e` — build, then run shell, `/lab`, saved learning, polling and recovery tests in Chromium and WebKit (phone + iPad widths).
- `pnpm report --video` — generate Markdown with phone/iPad recordings, screenshots and logs against a local server; see [docs/reports/README.md](docs/reports/README.md).
- `pnpm test:reports` — validate the report generator, browser capture, video conversion and artifact links.
- `pnpm test` — run workspace Vitest tests (`core` rules, game rounds, database).
- `pnpm db:reset` — recreate the local SQLite database, push the schema and seed the demo.
- `pnpm db:push` / `pnpm db:seed` / `pnpm db:studio` — apply the schema, add demo fixtures or inspect local data.
- `pnpm check:films` — validate every film in `apps/web/public/media/films` (script rules, art, mp3, catalog); podcast → film workflow in [films.md](docs/dev/films.md).
- `pnpm check` — Biome lint/format checks, `check:games` (self-contained game folders), then TypeScript checks.
- `/lab` (in `pnpm dev`) — play any registered game with level/seed and watch its events; `/lab/brainy` — Brainy presets, stat sliders, accessories.
- `pnpm typecheck` — workspace TypeScript checks through Turborepo.
- `pnpm format` — format source and config files with Biome.

`pnpm games:build` bundles same-origin embedded games; `pnpm test:assets` validates their builds. Database paths, browser installation and all commands are in [docs/dev/setup.md](docs/dev/setup.md).

## Conventions and tools

- [docs/dev/conventions.md](docs/dev/conventions.md). **One branch only: `master`** (no feature branches). Personal workflow preferences live in `.local/`.
- Skills to use or skip: [docs/dev/agent-tooling.md](docs/dev/agent-tooling.md). UI work follows [docs/dev/ui.md](docs/dev/ui.md): Base UI components via shadcn, prototype tokens, and the lightest motion layer that works; don't invent a new visual style.
- After UI changes: render the page, check phone and iPad widths, run the Playwright spec.
