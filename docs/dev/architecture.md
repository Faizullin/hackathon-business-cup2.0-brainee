# Architecture

> **Status: child learning preview + saved-session API ready.** The workspace, core/Brainy, two React games, child shell and SQLite/Drizzle connected-demo subset exist. The [session contract](sessions.md) is implemented; UI polling and the parent view are next. The reasoning behind each choice is in [decisions.md](decisions.md).

**Guiding principle: local-first, zero infrastructure.** One SQLite file, media in the repo. Clone → `pnpm dev` works with no accounts, Docker or cloud services. Don't assume one long-running process or a writable disk: the final deploy is serverless (D-15).

## Monorepo layout

pnpm workspaces + Turborepo, TypeScript everywhere. Internal packages export TS source directly, with no build step (Just-in-Time packages), so edits hot-reload across the repo.

```
brainee/
├─ apps/
│  ├─ web/          # Main PWA: child + parent UI + API (Next.js)
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
apps/web/
├─ src/app/
│  ├─ layout.tsx, page.tsx    # Fonts/providers only; / redirects to /learn
│  ├─ (child)/layout.tsx      # Child shell: content + persistent 4-tab bottom bar (T-30)
│  ├─ (child)/(docked)/       # Brainy dock layout: learn (game grid), leisure, gifts (stubs)
│  ├─ (child)/brainy/         # Brainy tab (no dock): big Brainy + stage path
│  ├─ (parent)/analytics/     # Starter page; barrier, data and other parent routes planned
│  ├─ (auth)/login/           # Welcome page; sessions, quiz and onboarding planned
│  ├─ (game)/game/[id]/       # Fullscreen play (no dock/tab bar); `?level=&seed=`
│  ├─ lab/, lab/brainy/       # Dev-only game lab + event stream; Brainy presets (T-16, T-20)
│  └─ api/                   # Demo access + issued game start/finish/stop; /api/state is T-55
├─ public/media/             # Planned: own-domain media
└─ e2e/                      # Scaffold smoke tests (Chromium + WebKit)
```

Child routes use their own shell (tab bar; dock via the nested `(docked)` group); parent and auth routes still use the starter `AppFrame`. Fullscreen games use the sibling `(game)` group. Child data comes from `demoChild` plus the [temporary progress provider](ui.md#temporary-learning-preview-t-35) until T-55 replaces it with saved state. The demo cookie/session API exists but is not called by that provider yet. Parent routes remain placeholders; the parent barrier (T-40) must land before parent data/actions are added.

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

**Data flow:** the host obtains a server-issued game ID, then reports `GameResult` → `POST /api/sessions` → `core` computes ★ and stat deltas → `db` writes in one transaction (bumps the family's `version`). The [implemented contract](sessions.md) covers access, launch, retries and stopping. Child/parent `/api/state` polling (~3 s) and UI wiring remain T-55.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (latest stable at scaffold time), React, TypeScript strict |
| Styling / UI | Tailwind CSS 4 + **shadcn/ui on Base UI** (`@base-ui/react`) restyled with prototype tokens, for child and parent; Lucide (parent/system) + custom SVGs (child) → [ui.md](ui.md) |
| Animation | CSS → React `<ViewTransition>` (routes, shared elements) → Motion `LazyMotion` (physics, gestures, rewards); Motion Primitives per component |
| Charts | Recharts |
| DB | **SQLite** via libSQL client + Drizzle ORM (`file:./data/dev.db`); `drizzle-kit push` / `studio` |
| Auth | Demo session first (seeded family, cookie) + parent PIN; Better Auth as a stretch goal |
| Live sync | Short polling via TanStack Query (~3 s, version check). Works locally and on serverless |
| Media | Files in `apps/web/public/media`, no object storage |
| Browser storage | UI preferences only; the server is the source of truth (parent needs live data) |
| PWA | Serwist |
| Fonts | `next/font` (self-hosted) |
| Lint / format | Biome |
| Tests | Vitest (`core`, `brainy`, bridge, game rounds); asset-integrity script; Playwright in **Chromium + WebKit** (games, demo flow, acceptance criteria) |
| Games | React (default); embedded via iframe + bridge for Phaser (esbuild), GDevelop (`gdexporter`), Three.js, static builds |
| Game lab | dev-only `/lab` route in `apps/web` |
| Deploy | **Final step only (T-14):** Vercel Hobby (free) + Turso free libSQL via the same Drizzle driver. Nothing deploy-specific before then |

Own-domain constraint: [rules.md](../product/rules.md#technical-requirements). Agent tooling (skills, MCP): [agent-tooling.md](agent-tooling.md).
