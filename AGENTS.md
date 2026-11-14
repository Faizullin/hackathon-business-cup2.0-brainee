# AGENTS.md

The single source of instructions for AI coding agents. `CLAUDE.md` and `GEMINI.md` only import this file, so edit it here.

**Project:** Брейни, a kids' learning PWA with a growing mascot and a two-currency reward economy. Summary: [README.md](README.md).

## Session protocol

**At the start** (keep it cheap, don't read the whole docs tree):
1. Read [docs/progress/status.md](docs/progress/status.md): current phase, focus and handoff note.
2. Find your task in [docs/progress/todo.md](docs/progress/todo.md).
3. Open only the docs that task needs. Use the "Read when" column in [docs/README.md](docs/README.md).

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
- **Local-first, no new infrastructure.** SQLite file, media in `public/media`, one Node process. Don't add backend services, cloud SDKs, auth or payment providers without a new entry in [decisions.md](docs/dev/decisions.md).
- **Product rules:** no feeds, autoplay or "watch next". Kids never see rankings. Brainy never dies. No medical claims. → [rules.md](docs/product/rules.md#product-rules)

## Commands

- `pnpm install` — install the workspace using the pinned package manager and lockfile.
- `pnpm dev` — start the Next.js web app at `http://localhost:3000`.
- `pnpm build` / `pnpm start` — build and serve the production web app.
- `pnpm e2e` — build, then run the scaffold smoke tests in Chromium and WebKit (phone + iPad widths).
- `pnpm check` — Biome lint/format checks, then workspace TypeScript checks.
- `pnpm typecheck` — workspace TypeScript checks through Turborepo.
- `pnpm format` — format source and config files with Biome.

Database and game commands are still planned. Browser installation and all commands are in [docs/dev/setup.md](docs/dev/setup.md).

## Conventions and tools

- [docs/dev/conventions.md](docs/dev/conventions.md). Commit or push only when the user asks.
- Skills to use or skip: [docs/dev/agent-tooling.md](docs/dev/agent-tooling.md). UI work follows [docs/dev/ui.md](docs/dev/ui.md): Base UI components via shadcn, prototype tokens, and the lightest motion layer that works; don't invent a new visual style.
- After UI changes: render the page, check phone and iPad widths, run the Playwright spec.
