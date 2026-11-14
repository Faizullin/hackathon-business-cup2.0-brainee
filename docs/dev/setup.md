# Setup

> **Status: saved child learning flow and polling ready.** Install, server/build, Vitest, database tools and browser tests work. The bridge and Picture Puzzle build locally.

## Prerequisites
- Node.js >= 22.13; `.nvmrc` selects Node 22.
- pnpm 11.23.0 (pinned in `package.json`). If needed: `npm install --global pnpm@11.23.0`.
- Nothing else: no Docker, no database server, no cloud accounts.

## First run
Fastest manual run: `pnpm demo` (resets `data/dev.db`, then starts the dev server with `DEMO_MODE=1 BRAINEE_LAB=1`). Otherwise enable demo access using the [database setup](#local-database-and-tests) (`DEMO_MODE=1` in `apps/web/.env.local`, or `DEMO_MODE=1 pnpm dev`; `turbo.json` passes `DEMO_MODE`, `BRAINEE_LAB` and `DATABASE_URL` through). Without it every child/parent screen shows «Не удалось загрузить Брейни». Then:
```bash
pnpm install
pnpm db:reset
pnpm games:build
pnpm dev
```

Available commands:

| Command | Does |
|---|---|
| `pnpm dev` | Start the Next.js app at `http://localhost:3000` |
| `pnpm build` | Build the production app through Turborepo |
| `pnpm start` | Serve the built app at `http://localhost:3000` |
| `pnpm e2e` | Build, then run Playwright against a production server on :3100 |
| `pnpm report --video` | Generate a Markdown UI report with recordings, screenshots and logs against a local server on :3123; [instructions](../reports/README.md) |
| `pnpm test:reports` | Test report validation, browser capture, video conversion and report links |
| `pnpm test` | Run the workspace Vitest suites through Turborepo (`core` rules, game rounds, DB) |
| `pnpm db:push` | Apply `packages/db/schema.ts` to the local SQLite file using Drizzle Kit |
| `pnpm db:seed` | Add missing demo fixtures without overwriting balances |
| `pnpm db:refresh-demo` | Replace only the shared demo family with the current seed; other and jury families stay. With `.env.deployed` vars it updates the cloud DB |
| `pnpm db:reset` | Delete the database + WAL/SHM files, push schema and seed the demo |
| `pnpm db:studio` | Open Drizzle's local data inspector |
| `pnpm check` | Biome lint + format checks, game boundaries and manifests, then workspace TypeScript checks |
| `pnpm check:games` | Fail if a game folder imports another game or a non-core `@brainee/*` package |
| `pnpm typecheck` | Run each package's `typecheck` through Turborepo |
| `pnpm format` | Format source and config files; Markdown and frozen prototype sources are excluded |

Before opening child screens, set `DEMO_MODE=1` in `apps/web/.env.local` ([database setup below](#local-database-and-tests)). `/` redirects to the entry screen `/entry`; child and parent screens require saved state and show a retry screen if unavailable. Parent pages (`/analytics`, `/tasks`, `/rewards`) need PIN `1234`. **`/lab`** is an independent game harness ([games.md](games.md#lab)): on in `pnpm dev`, 404 in production unless `BRAINEE_LAB=1` (the e2e server sets it). Parent access/view remains a follow-up.

pnpm permits the esbuild install script required by tsx/Drizzle Kit and Vitest's toolchain. Other dependency build scripts remain subject to pnpm's approval settings.

## Browser smoke tests
Install browser binaries once, then run the spec:
```bash
pnpm --filter @brainee/web exec playwright install chromium webkit
pnpm e2e
```
The suite checks shells, both games, saved post-game progression, polling, retry/reload recovery, session APIs, cookies, routing, fonts, Russian text, themes, reduced motion, touch targets, overflow and own-domain requests at 390px and 820px in both engines. Screenshots/traces are in `apps/web/test-results/` (gitignored). Playwright seeds a unique temporary SQLite file before starting its server, enables demo mode there, and cleans up afterward; it does not touch `data/dev.db`. One worker avoids competing tests mutating the shared seeded child; assertions use saved balances/capped gains rather than a fixed 340★. On macOS, WebKit keyboard traversal uses Option-Tab to include links. Emulation does not replace the real-device Screen Time check (T-62).

### WebKit pointer diagnostics (T-93)
Observed on this Mac on 2026-11-14 with pinned WebKit 2388: DOM hit testing identifies the correct link, but a mouse click requested at `(100, 430)` produces a pointer event near `(-1095, 1570)`. Playwright reports `<html> intercepts pointer events`. The same failure occurs on a plain HTML button; one worker, headed mode and a forced reinstall did not resolve it. API/browser-fetch tests pass in WebKit. This is an input-coordinate problem outside the application, not evidence that its UI click flows passed. Keep the normal click assertions; do not bypass them with forced clicks or synthetic DOM events.

Follow-up in the T-55 session: all 112 browser tests passed, including WebKit phone/iPad UI flows with normal pointer input. No forced clicks, synthetic click replacements or browser-flag workaround were added. The earlier failure did not recur; its cause remains unconfirmed. T-93 is no longer a verification blocker; retain this repro for a recurrence.

Reproduce independently of the app and database:
```bash
pnpm --filter @brainee/web exec node --input-type=module <<'JS'
import { webkit } from '@playwright/test';
const browser = await webkit.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('console', message => console.log(message.text()));
  await page.setContent('<button style="width:200px;height:100px">Click me</button>');
  await page.evaluate(() => document.addEventListener('pointerdown', e => console.log(e.clientX, e.clientY)));
  await page.getByRole('button').click({ timeout: 3000 });
} finally { await browser.close(); }
JS
```

## Shared config and internal packages
`packages/config` exports strict TypeScript presets (`base.json`, `react.json`, `nextjs.json`), the shared Biome config, and a Tailwind v4 CSS entry. The app uses the Tailwind PostCSS plugin and `@brainee/ui/styles.css`. UI and motion guidance lives in [ui.md](ui.md).

`packages/ui` contains the `base-maia` shadcn Button (Base UI), Card and Skeleton, shared button/link styles, Lucide exports, palette/motion tokens, and `MotionProvider` (`MotionConfig` + async `LazyMotion`, strict mode). It exports TS source directly and participates in `pnpm typecheck`. Its semantic `text-muted-foreground` maps to the prototype's `--muted` text color; `bg-muted` maps to `--surface-2`.

Both `components.json` files target the shared package. Add primitives from the app, then adapt their styles and targets to [ui.md](ui.md):
```bash
pnpm dlx shadcn@4.23.0 add dialog --cwd apps/web
```
The CLI is used during development; it is not a runtime dependency. Existing setup uses Base UI and Lucide; avoid rerunning `init` over the prototype theme. Links use `buttonVariants` with Next's `Link`, retaining anchor semantics rather than using a Base UI Button's `render` prop.

`apps/web/src/app/fonts.ts` loads vendored Onest/Unbounded variable WOFF2 files through `next/font/local`. They include Cyrillic and Latin, require no font download at build time, and are served as own-domain Next assets. Source and license information is in `packages/ui/src/fonts/SOURCES.txt` and the adjacent OFL files. The root layout owns fonts/providers only; each route group opts into `AppFrame` for its starter chrome.

Internal packages use the `@brainee/*` scope and `workspace:*` references. Their exports point directly at TS source, with no `dist/` or build script. TypeScript configs extend `@brainee/config`; the web app configures workspace packages in `transpilePackages`. The database package is Node/server-only.

Workspace globs include `apps/*`, `packages/*` and `games/*`. React games live in `packages/games/src/<id>/` (first: `odd-one-out`). Embedded games use `games/*`, `packages/game-bridge` and `packages/engine-phaser`; design in [games.md](games.md).

## Local database and tests
`packages/db` uses the Node libSQL client and Drizzle. `openDatabase()` creates an explicit connection; importing the package performs no DB I/O. Callers close the returned `client` when finished. Foreign keys, a busy timeout and WAL mode are enabled on its single configured native handle. Request handlers own their connection lifetime. The pinned driver compatibility patch and deferred secondary indexes are documented in [D-19](decisions.md).

The implemented schema and fixture scope are described in [data-model.md](../product/data-model.md). There are no migrations during the hackathon: edit `packages/db/schema.ts`, then use `db:reset`. Stop any process holding an open DB connection before reset. Reset refuses to overwrite a non-SQLite file.

To enable the connected child flow, copy the example if needed, edit `DEMO_MODE` to `1`, then prepare the database:
```bash
cp apps/web/.env.example apps/web/.env.local
pnpm db:reset
pnpm test
```
DB scripts load `apps/web/.env.local` if present; shell variables take precedence. The default `DATABASE_URL=file:./data/dev.db` resolves from the **workspace root**, regardless of whether the caller runs in the root, `apps/web` or `packages/db`. Absolute paths/file URLs also work. Only local files are supported; no remote database URL or token is needed. Database files and sidecars stay gitignored.

The example defaults demo access off; explicitly set `DEMO_MODE=1` in `apps/web/.env.local` before restarting the app. Use push/seed instead of reset to preserve existing data. This exposes only the seeded demo child; [sessions.md](sessions.md) defines the cookie, snapshot, launch and recovery contract. The lab and public placeholders still work without a database; no local rewards are granted as a fallback when the API is off.

`packages/config` shares a Node Vitest configuration. Core rules, Brainy rendering, game rounds and database persistence have tests. DB tests use isolated temporary files, including concurrent finishes and rollback. `pnpm test` runs these workspace suites; `test:reports` and `e2e` remain separate commands.

## Scripts (planned, via Turborepo)
| Command | Does |
|---|---|
| `pnpm gen:game` | Scaffold a new game (react or embedded) + register it |
| `pnpm games:build` | Build `bridge.js` + every embedded game, replace `public/games/<id>/` ([games.md](games.md)) |
| `pnpm test:assets` | Check every built game's referenced files exist |

Next.js ships version-matched docs at `apps/web/node_modules/next/dist/docs/`; read the relevant pages before using Next APIs. `next typegen` runs before TypeScript checks, so a clean checkout needs no previous build. `next-env.d.ts` and `.next/` are generated and ignored. If Next adds agent instructions, retain them alongside the project instructions.

## Environment variables
| Var | Default | Notes |
|---|---|---|
| `DATABASE_URL` | `file:./data/dev.db` | Implemented: workspace-relative SQLite path, or absolute file URL |
| `DEMO_MODE` | unset/off | `1` enables the demo session/result APIs at runtime; all other values return 404 |
| `PARENT_PIN` | — | Not implemented; the seeded parent has a hashed demo PIN, with the barrier still T-40 |
| `BRAINEE_LAB` | unset | `1` enables `/lab` in a production build (always on in `next dev`) |

## Deploy
Not now. Deploying is the final roadmap step (T-14): Vercel Hobby + Turso free plan via Drizzle ([D-15](decisions.md)). Until then, everything runs locally.

## Testing on a real device
1. Before deploying: run `pnpm build && pnpm --filter @brainee/web exec next start --hostname 0.0.0.0` and open `http://<mac-ip>:3000` on an iPad on the same Wi-Fi (layout, touch, WebKit).
2. After T-14: on the iPad, Settings → Screen Time → Content & Privacy → Web Content → Allowed Websites Only, then add only `<project>.vercel.app`.
3. Add the site to the Home Screen and go through the demo flow. Any blank image or font means something loads from a foreign domain.

## Embedded games (T-29 / T-85)

- `pnpm games:build` builds the local bridge and all registered learning games and Explore previews, replacing their directories under `apps/web/public/games/`. Run before `pnpm dev` on a new checkout or after changing an embedded game; `pnpm build` does this automatically.
- `pnpm test:assets` verifies built entries, referenced assets, pictures, bridge script and manifest size budgets. `pnpm check:manifests` validates every listed game's manifest; included in `pnpm check`.
- For an existing DB, run `pnpm db:push && pnpm db:seed` to add game runtime columns and catalog entries. `pnpm demo` resets the local demo as usual.
- `/lab` now includes «Собери картинку». Its events use the same `round`/`finish` contract as React games; embedded ready changes the event stream to `data-status="connected"`. Standalone: `/games/picture-puzzle/index.html?level=3&seed=42`.

### Isolated game worktree verification

When a task explicitly authorizes a worktree, keep its SQLite and build output separate:

```sh
DATABASE_URL=file:./data/games.db pnpm db:reset
DATABASE_URL=file:./data/games.db BRAINEE_NEXT_DIR=.next-games DEMO_MODE=1 BRAINEE_LAB=1 pnpm --filter @brainee/web exec next dev --port 3001
DATABASE_URL=file:./data/games.db BRAINEE_NEXT_DIR=.next-games BRAINEE_E2E_PORT=3101 BRAINEE_LAB=1 DEMO_MODE=1 pnpm e2e
```

`BRAINEE_E2E_PORT` defaults to 3100; tests still create and clean up their own temporary database. `BRAINEE_NEXT_DIR` defaults to `.next` and is passed through Turbo. Run `pnpm games:build` before dev. `pnpm check:manifests` additionally checks pinned path-C source hashes; `pnpm test:assets` checks the generated local output and size budgets. No import-time network is used by these commands.


### Games-only iPad review

In an isolated games worktree, build once with `BRAINEE_NEXT_DIR=.next-games pnpm build`, then run the focused iPad Safari suite:

```sh
BRAINEE_NEXT_DIR=.next-games BRAINEE_E2E_PORT=3114 pnpm --filter @brainee/web e2e game-conformance.spec.ts picture-puzzle.spec.ts tangram.spec.ts reflection.spec.ts rhythm-copycat.spec.ts secret-message-copy.spec.ts magnet-explorer.spec.ts neighborhood-map-walk.spec.ts --project=webkit-ipad
```

The test server owns a temporary SQLite database. Review generated `apps/web/test-results` screenshots. `/lab` tests explicitly select the iPad frame on tablet projects. For an unchanged app build, `pnpm games:build && pnpm test:assets` refreshes static game-only edits without rebuilding Next. Run the full four-project matrix before broader integration; keep unrelated onboarding/settings failures separate from game acceptance. Do not merge this games branch into master without a new explicit instruction.
