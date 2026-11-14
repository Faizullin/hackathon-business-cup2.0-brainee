# Setup

> **Status: planned.** These commands become real once T-10 (scaffold) is done. Then update this file and the Commands section of `AGENTS.md`.

## Prerequisites
- Node.js 22 LTS, pnpm 9+
- Nothing else: no Docker, no database server, no cloud accounts.

## First run (planned)
```bash
pnpm install
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
| `pnpm check` | Biome lint + format, plus `tsc` typecheck |

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
