# Architecture

> **Status: planned.** Nothing is scaffolded yet. When reality differs from this file, update this file. The reasoning behind each choice is in [decisions.md](decisions.md).

**Guiding principle: local-first, zero infrastructure.** One SQLite file, media in the repo, one Node process. Clone → `pnpm dev` works with no accounts, Docker or cloud services.

## Monorepo layout

pnpm workspaces + Turborepo, TypeScript everywhere. Internal packages export TS source directly, with no build step (Just-in-Time packages), so edits hot-reload across the repo.

```
brainee/
├─ apps/
│  ├─ web/          # Main PWA: child + parent UI + API (Next.js, single Node process)
│  └─ landing/      # Optional: marketing / pitch page
├─ packages/
│  ├─ core/         # Pure logic + shared types (GameResult, Skill, Stats…)
│  ├─ brainy/       # Brainy SVG renderer (port of prototype brainy())
│  ├─ games/        # Game contract, GameHost, registry, React games  → games.md
│  ├─ game-bridge/  # Any-engine iframe bridge (ported from game-store-planning bridge-core)
│  ├─ engine-phaser/   # Phaser adapter, BridgedScene, esbuild build helper
│  ├─ engine-gdevelop/ # gdexporter build helper + runtime hook
│  ├─ db/           # Drizzle schema (SQLite), seeds, demo scenarios
│  ├─ ui/           # Shared components + design tokens
│  └─ config/       # tsconfig, Biome, Tailwind presets
├─ games/           # Embedded games, one workspace package each (manifest.json → dist/)
├─ turbo/generators/ # `pnpm gen:game` template
├─ data/            # Local SQLite file (gitignored)
└─ docs/
```

Dependency direction (no cycles): `core` ← `brainy`, `games`, `db` ← `ui` ← `apps/*`. `core` and `game-bridge` import nothing internal. Embedded games in `games/*` depend only on `game-bridge` and an `engine-*` kit. `pnpm games:build` copies their output to `/games/<id>/`, and `db:seed` registers them from their manifests.

### `apps/web` routes
One app, so child and parent share the session, the domain and a live Brainy.
```
app/
├─ (child)/      learn, leisure, gifts, brainy, game/[id], entry
├─ (parent)/     analytics, tasks, rewards   ← behind the parent-barrier middleware
├─ (auth)/       demo login, quiz, onboarding
├─ lab/          dev-only game lab + event stream panel
├─ api/          route handlers + /api/stream (SSE)
└─ public/media/ seed videos, images, game assets (served from our domain)
```

## Package responsibilities

| Package | Owns | Must not |
|---|---|---|
| `core` | Star rules, ☀→★ exchange, stage/mood math, stat gain formula, entry recommendation algorithm, task limit; shared types | import React, touch the DB, or do I/O |
| `brainy` | `<Brainy stats accessories />` SVG, color mix, stage visuals | hold any game rules |
| `games` | Contract, `GameHost` (React or iframe runtime), registry, React games; emit a `GameResult` | grant stars, fetch, or load foreign assets |
| `game-bridge` | Handshake + MessageChannel protocol, zod validation (host side), ESM + IIFE `bridge.js`, standalone mode | depend on React or the app |
| `engine-*` | Engine adapters + build helpers shared by embedded games | contain game content |
| `games/<id>` | One embedded game: `manifest.json`, source, `build.mjs` → `dist/` | load anything outside our origin |
| `db` | Schema per [data-model.md](../product/data-model.md), seeds, scenario fixtures | contain business rules |
| `ui` | Buttons, cards, dock, tab bars; tokens from the prototype (`--coral`, `--sun`, `--mint`, `--sky`; Unbounded + Onest) | |

**Data flow:** game emits `GameResult` → `POST /api/sessions` → `core` computes ★ and stat deltas → `db` write in one transaction → in-process event bus → SSE → child and parent UIs update.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (latest stable at scaffold time), React, TypeScript strict |
| Styling / UI | Tailwind CSS; shadcn/ui + Lucide for the parent dashboard; hand-built child UI |
| Animation | Motion; Motion Primitives copied in selectively (counters, transitions) |
| Charts | Recharts |
| DB | **SQLite** via libSQL client + Drizzle ORM (`file:./data/dev.db`); `drizzle-kit push` / `studio` |
| Auth | Demo session first (seeded family, cookie) + parent PIN; Better Auth as a stretch goal |
| Live sync | SSE + in-process EventEmitter (valid because we run one instance) |
| Media | Files in `apps/web/public/media`, no object storage |
| Browser storage | UI preferences only; the server is the source of truth (parent needs live data) |
| PWA | Serwist |
| Fonts | `next/font` (self-hosted) |
| Lint / format | Biome |
| Tests | Vitest (`core`, `brainy`, bridge, game rounds); asset-integrity script; Playwright in **Chromium + WebKit** (games, demo flow, acceptance criteria) |
| Games | React (default); embedded via iframe + bridge for Phaser (esbuild), GDevelop (`gdexporter`), Three.js, static builds |
| Game lab | dev-only `/lab` route in `apps/web` |
| Deploy | One container (`next start`) on Railway with a volume for the SQLite file + custom domain |

Own-domain constraint: [rules.md](../product/rules.md#technical-requirements). Agent tooling (skills, MCP): [agent-tooling.md](agent-tooling.md).
