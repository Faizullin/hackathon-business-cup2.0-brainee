# Setup

> **Status: local data foundation ready (T-10 – T-13).** Install, server/build, Vitest, database tools and browser smoke tests work. Game commands remain planned.

## Prerequisites
- Node.js >= 22.13; `.nvmrc` selects Node 22.
- pnpm 11.23.0 (pinned in `package.json`). If needed: `npm install --global pnpm@11.23.0`.
- Nothing else: no Docker, no database server, no cloud accounts.

## First run
```bash
pnpm install
pnpm db:reset
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
| `pnpm test` | Run the workspace Vitest suites through Turborepo |
| `pnpm db:push` | Apply `packages/db/schema.ts` to the local SQLite file using Drizzle Kit |
| `pnpm db:seed` | Add missing demo fixtures without overwriting balances |
| `pnpm db:reset` | Delete the database + WAL/SHM files, push schema and seed the demo |
| `pnpm db:studio` | Open Drizzle's local data inspector |
| `pnpm check` | Biome lint + format checks, then workspace TypeScript checks |
| `pnpm typecheck` | Run each package's `typecheck` through Turborepo |
| `pnpm format` | Format source and config files; Markdown and frozen prototype sources are excluded |

No environment variables or database are needed for the starter screens. `/` redirects to `/learn`; `/analytics` and `/login` exercise the parent and auth route groups. These are placeholders; sessions and the parent PIN are not implemented yet, and no family data is exposed.

pnpm permits the esbuild install script required by tsx/Drizzle Kit and Vitest's toolchain. Other dependency build scripts remain subject to pnpm's approval settings.

## Browser smoke tests
Install browser binaries once, then run the spec:
```bash
pnpm --filter @brainee/web exec playwright install chromium webkit
pnpm e2e
```
The suite has 20 checks for routing, keyboard return links, locally loaded fonts, Russian content, light/dark tokens, reduced motion, touch target sizes, overflow, console errors and own-domain requests at 390px and 820px in both engines. It saves `/learn` screenshots in `apps/web/test-results/` (gitignored). On macOS, WebKit keyboard traversal uses Option-Tab to include links. WebKit emulation does not replace the real-device Screen Time check (T-62).

## Shared config and internal packages
`packages/config` exports strict TypeScript presets (`base.json`, `react.json`, `nextjs.json`), the shared Biome config, and a Tailwind v4 CSS entry. The app uses the Tailwind PostCSS plugin and `@brainee/ui/styles.css`. UI and motion guidance lives in [ui.md](ui.md).

`packages/ui` contains the `base-maia` shadcn Button (Base UI), Card and Skeleton, shared button/link styles, Lucide exports, palette/motion tokens, and `MotionProvider` (`MotionConfig` + async `LazyMotion`, strict mode). It exports TS source directly and participates in `pnpm typecheck`. Its semantic `text-muted-foreground` maps to the prototype's `--muted` text color; `bg-muted` maps to `--surface-2`.

Both `components.json` files target the shared package. Add primitives from the app, then adapt their styles and targets to [ui.md](ui.md):
```bash
pnpm dlx shadcn@4.23.0 add dialog --cwd apps/web
```
The CLI is used during development; it is not a runtime dependency. Existing setup uses Base UI and Lucide; avoid rerunning `init` over the prototype theme. Links use `buttonVariants` with Next's `Link`, retaining anchor semantics rather than using a Base UI Button's `render` prop.

`apps/web/src/app/fonts.ts` loads vendored Onest/Unbounded variable WOFF2 files through `next/font/local`. They include Cyrillic and Latin, require no font download at build time, and are served as own-domain Next assets. Source and license information is in `packages/ui/src/fonts/SOURCES.txt` and the adjacent OFL files. The root layout owns fonts/providers only; each route group opts into `AppFrame` for its starter chrome.

Internal packages use the `@brainee/*` scope and `workspace:*` references. `@brainee/core` is the first empty example: its package exports point directly at `src/index.ts`, with no `dist/` or build script. Its TypeScript config extends `@brainee/config/tsconfig/base.json`. The web app configures workspace packages in `transpilePackages`.

Workspace globs include `apps/*`, `packages/*` and `games/*`. Embedded-game packages will be added in their own tasks; the `/lab` and bridge design is in [games.md](games.md).

## Local database and tests
`packages/db` uses the Node libSQL client and Drizzle. `openDatabase()` creates an explicit connection; importing the package performs no DB I/O. Callers close the returned `client` when finished. Foreign keys, a busy timeout and WAL mode are enabled on open. This is server-only code and is not wired into the starter UI.

The minimal schema and fixture scope are described in [data-model.md](../product/data-model.md). There are no migrations during the hackathon: edit `packages/db/schema.ts`, then use `db:reset`. Stop any process holding an open DB connection before reset. Reset refuses to overwrite a non-SQLite file.

No environment file is required. To override defaults, optionally copy and edit:
```bash
cp apps/web/.env.example apps/web/.env.local
pnpm db:reset
pnpm test
```
DB scripts load `apps/web/.env.local` if present; shell variables take precedence. The default `DATABASE_URL=file:./data/dev.db` resolves from the **workspace root**, regardless of whether the caller runs in the root, `apps/web` or `packages/db`. Absolute paths/file URLs work without a workspace marker, e.g. `DATABASE_URL=file:/data/brainee.db` on the server volume. Only local files are supported; no remote database URL or token is needed. Database files and sidecars stay gitignored.

`packages/config` shares a Node Vitest configuration. `core`, `brainy` and `games` are empty TS-source packages and intentionally allow no test files until P2 adds behavior. `db` requires tests and has 18 path/persistence checks against isolated temporary SQLite files. `pnpm test` runs these workspace tests; `test:reports` and `e2e` remain separate commands.

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
| `DEMO_MODE` | `true` | Planned (T-52): auto-login as the seeded demo family |
| `PARENT_PIN` | `1234` | Planned (T-40/T-52): parent barrier for the demo |

## Deploy (demo)
One container running `next start` on Railway, with a volume mounted at `/data` (`DATABASE_URL=file:/data/brainee.db`) and our custom domain. It's a single instance, so SQLite and in-process SSE just work. Don't scale beyond one replica.

## Testing on a real device
1. Open the deployed custom domain.
2. On an iPad: Settings → Screen Time → Content & Privacy → Web Content → Allowed Websites Only, then add only our domain.
3. Add the site to the Home Screen and go through the demo flow. Any blank image or font means something loads from a foreign domain.
