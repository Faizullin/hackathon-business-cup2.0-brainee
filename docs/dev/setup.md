# Setup

> **Status: foundation scaffolded (T-10).** The install and checks below work now. The web app, DB and game commands are planned and listed separately.

## Prerequisites
- Node.js >= 22.13; `.nvmrc` selects Node 22.
- pnpm 11.23.0 (pinned in `package.json`). If needed: `npm install --global pnpm@11.23.0`.
- Nothing else: no Docker, no database server, no cloud accounts.

## First run
```bash
pnpm install
pnpm check
```

Available commands:

| Command | Does |
|---|---|
| `pnpm check` | Biome lint + format checks, then workspace TypeScript checks |
| `pnpm typecheck` | Run each package's `typecheck` through Turborepo |
| `pnpm format` | Format source and config files; Markdown and frozen prototype sources are excluded |

The web app does not exist yet, so there is no development server or runnable UI at this step.

## Shared config and internal packages
`packages/config` exports strict TypeScript presets (`base.json`, `react.json`, `nextjs.json`), the shared Biome config, and a Tailwind v4 CSS entry. The CSS maps utility names to the prototype's variables; token values and fonts belong in `packages/ui` (T-12). The Next.js app will add Tailwind's bundler integration in T-11/T-12.

Internal packages use the `@brainee/*` scope and `workspace:*` references. `@brainee/core` is the first empty example: its package exports point directly at `src/index.ts`, with no `dist/` or build script. Its TypeScript config extends `@brainee/config/tsconfig/base.json`. Future apps must transpile these source exports with their bundler.

Workspace globs already include `apps/*`, `packages/*` and `games/*`. Apps and embedded-game packages will be added in their own tasks; the updated `/lab` and bridge design is in [games.md](games.md).

## Application first run (planned, T-11 – T-13)
```bash
cp apps/web/.env.example apps/web/.env.local   # defaults work as-is
pnpm db:reset       # create data/dev.db, push schema, seed the demo family
pnpm dev            # web on http://localhost:3000
```

## Scripts (planned, via Turborepo)
| Command | Does |
|---|---|
| `pnpm dev` | Run web (+ landing) in watch mode; game lab at `/lab` |
| `pnpm gen:game` | Scaffold a new game (react or embedded) + register it |
| `pnpm games:build` | Build `bridge.js` + every embedded game, replace `public/games/<id>/` ([games.md](games.md)) |
| `pnpm test:assets` | Check every built game's referenced files exist |
| `pnpm db:push` | Apply the Drizzle schema to the SQLite file (no migrations during the hackathon) |
| `pnpm db:seed` | Seed the demo family + scenarios "после квиза / сейчас / только развлечения" |
| `pnpm db:reset` | Delete the DB file → push → seed (use freely; data is disposable) |
| `pnpm db:studio` | Drizzle Studio: browse and edit local data |
| `pnpm test` / `pnpm e2e` | Vitest / Playwright (Chromium + WebKit; run `games:build` first) |

> Next.js 16 `next dev` writes a "This is NOT the Next.js you know" rules block into an `AGENTS.md` (seen in game-store-planning). Commit it, and read the docs it points to (`node_modules/next/dist/docs/`) before using Next APIs.

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
