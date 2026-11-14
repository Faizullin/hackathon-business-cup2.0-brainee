# Setup

> **Status: UI foundation ready (T-10 – T-12).** Install, development server, production build and browser smoke tests work. Database and game commands are planned and listed separately.

## Prerequisites
- Node.js >= 22.13; `.nvmrc` selects Node 22.
- pnpm 11.23.0 (pinned in `package.json`). If needed: `npm install --global pnpm@11.23.0`.
- Nothing else: no Docker, no database server, no cloud accounts.

## First run
```bash
pnpm install
pnpm dev
```

Available commands:

| Command | Does |
|---|---|
| `pnpm dev` | Start the Next.js app at `http://localhost:3000` |
| `pnpm build` | Build the production app through Turborepo |
| `pnpm start` | Serve the built app at `http://localhost:3000` |
| `pnpm e2e` | Build, then run Playwright against a production server on :3100 |
| `pnpm check` | Biome lint + format checks, then workspace TypeScript checks |
| `pnpm typecheck` | Run each package's `typecheck` through Turborepo |
| `pnpm format` | Format source and config files; Markdown and frozen prototype sources are excluded |

No environment variables or database are needed for the starter screens. `/` redirects to `/learn`; `/analytics` and `/login` exercise the parent and auth route groups. These are placeholders; sessions and the parent PIN are not implemented yet, and no family data is exposed.

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

## Database first run (planned, T-13)
```bash
cp apps/web/.env.example apps/web/.env.local   # defaults work as-is
pnpm db:reset       # create data/dev.db, push schema, seed the demo family
```

## Scripts (planned, via Turborepo)
| Command | Does |
|---|---|
| `pnpm gen:game` | Scaffold a new game (react or embedded) + register it |
| `pnpm games:build` | Build `bridge.js` + every embedded game, replace `public/games/<id>/` ([games.md](games.md)) |
| `pnpm test:assets` | Check every built game's referenced files exist |
| `pnpm db:push` | Apply the Drizzle schema to the SQLite file (no migrations during the hackathon) |
| `pnpm db:seed` | Seed the demo family + scenarios "после квиза / сейчас / только развлечения" |
| `pnpm db:reset` | Delete the DB file → push → seed (use freely; data is disposable) |
| `pnpm db:studio` | Drizzle Studio: browse and edit local data |
| `pnpm test` | Vitest unit tests (T-13); extend `pnpm e2e` with game tests after `games:build` exists |

Next.js ships version-matched docs at `apps/web/node_modules/next/dist/docs/`; read the relevant pages before using Next APIs. `next typegen` runs before TypeScript checks, so a clean checkout needs no previous build. `next-env.d.ts` and `.next/` are generated and ignored. If Next adds agent instructions, retain them alongside the project instructions.

## Environment variables (planned)
| Var | Default | Notes |
|---|---|---|
| `DATABASE_URL` | `file:../../data/dev.db` | libSQL URL; a file path locally and on the server volume |
| `DEMO_MODE` | `true` | Auto-login as the seeded demo family |
| `PARENT_PIN` | `1234` | Parent barrier for the demo |

## Deploy (demo)
One container running `next start` on Railway, with a volume mounted at `/data` (`DATABASE_URL=file:/data/brainee.db`) and our custom domain. It's a single instance, so SQLite and in-process SSE just work. Don't scale beyond one replica.

## Testing on a real device
1. Open the deployed custom domain.
2. On an iPad: Settings → Screen Time → Content & Privacy → Web Content → Allowed Websites Only, then add only our domain.
3. Add the site to the Home Screen and go through the demo flow. Any blank image or font means something loads from a foreign domain.
