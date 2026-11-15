# Architecture

> **Status: presentation build complete and deployed** at `https://brainee.vercel.app` (Vercel Hobby + Turso, D-15). Child, parent, funnel, games, films and polling sync are built on the layout below. The reasoning behind each choice is in [decisions.md](decisions.md).

**Guiding principle: local-first, zero infrastructure.** One SQLite file, media in the repo. Clone → `pnpm install && pnpm demo` works with no accounts, Docker or cloud services. Don't assume one long-running process or a writable disk: the deploy is serverless (D-15).

## Monorepo layout

pnpm workspaces + Turborepo, TypeScript everywhere. Internal packages export TS source directly, with no build step (Just-in-Time packages), so edits hot-reload across the repo.

```
brainee/
├─ apps/
│  └─ web/            # The PWA: funnel, child + parent UI, API routes (Next.js)
├─ packages/
│  ├─ core/           # Pure rules + shared types (economy, stats, stages, funnel scoring, GameResult)
│  ├─ brainy/         # Brainy SVG renderer (port of the design's Brain component)
│  ├─ films/          # Interactive films: art, FilmStage, film checks → films.md
│  ├─ games/          # Game contract, GameHost, React games, Explore player → games.md
│  ├─ game-bridge/    # Any-engine iframe bridge (ported from game-store-planning)
│  ├─ game-catalog/   # Manifest schema, generated registry and thumbnails (D-38)
│  ├─ engine-phaser/  # Phaser adapter, BridgedScene, shared GSP helpers, esbuild helper
│  ├─ db/             # Drizzle schema (SQLite/libSQL), stores, seeds, demo/jury families
│  ├─ ui/             # Base UI/shadcn primitives, lavender tokens, motion provider
│  └─ config/         # tsconfig and Tailwind presets
├─ games/             # Embedded games, one workspace package each (manifest.json → dist/)
├─ scripts/           # games:build, manifest/palette checks, reports, films, prepare-dev
├─ data/              # Local SQLite file (gitignored; created on first `pnpm dev`)
└─ docs/
```

Dependency direction (no cycles): `core` ← `brainy`, `games`, `db` ← `ui` ← `apps/*`. `core` and `game-bridge` import nothing internal. Embedded games in `games/*` depend only on `game-bridge` and an `engine-*` kit. `pnpm install` discovers games from their folders into a generated registry; `pnpm games:build` copies their output to `/games/<id>/`, and `db:seed` registers them in the database catalog.

### `apps/web` routes
One app, so child and parent share the session, the domain and a live Brainy. Full route rules: [routes-spec.md](../product/routes-spec.md).
```
apps/web/src/app/
├─ layout.tsx, page.tsx      # Fonts/providers; / → /entry with a family session, else /start
├─ (funnel)/start/           # Brain Check sales funnel: quiz, brain meter, plan, offer (D-40, D-41)
├─ (auth)/                   # login, signup, child-login, onboarding/setup, jury (one-tap demo family)
├─ (child)/(docked)/         # Brainy dock layout: learn, leisure (fun shop + films), gifts, explore
├─ (child)/brainy, path      # Brainy tab (accessory shop, stats); weekly path, stages, discoveries
├─ (game)/                   # Fullscreen: entry, game/[id], explore/[id], fun/[id], video/[id] (films)
├─ (parent)/                 # PIN barrier + tabs: analytics, tasks, rewards, settings
├─ lab/                      # Game lab, Brainy presets, film and step harnesses (dev or BRAINEE_LAB=1)
└─ api/                      # auth, jury, onboarding(/start), device, pairing, sessions, state, actions, parent, settings, fun, demo-*
```

Child routes use their own shell (tab bar; dock via the nested `(docked)` group); parent routes use `ParentShell` (PIN gate, top/bottom tabs); auth uses the starter `AppFrame`. Fullscreen games, the entry screen and the video player use the `(game)` group. `LearningProvider` loads the versioned snapshot (child state + seeded showcase, D-21) for child, game and parent routes and exposes `act()` for demo interactions.

## Package responsibilities

| Package | Owns | Must not |
|---|---|---|
| `core` | Star rules, ☀→★ exchange, stage/mood math, stat gain formula, entry recommendation algorithm, task limit; shared types | import React, touch the DB, or do I/O |
| `brainy` | `<Brainy stats accessories />` SVG, color mix, stage visuals | hold any game rules |
| `films` | Film art (`FILM_BG`, `FILM_PROPS`), `<FilmStage>`, layout check, `FILM_IDS`; `pnpm check:films` ([films.md](films.md)) | grant stars, play audio, or load foreign assets |
| `games` | Contract, `GameHost` (React or iframe runtime), registry, React games; emit a `GameResult` | grant stars, fetch, or load foreign assets |
| `game-bridge` | Handshake + MessageChannel protocol, zod validation (host side), ESM + IIFE `bridge.js`, standalone mode | depend on React or the app |
| `engine-*` | Engine adapters + build helpers shared by embedded games | contain game content |
| `games/<id>` | One embedded game: `manifest.json`, source, `build.mjs` → `dist/` | load anything outside our origin |
| `db` | Schema per [data-model.md](../product/data-model.md), seeds, scenario fixtures | contain business rules |
| `ui` | Buttons, cards, dock, tab bars; lavender tokens per [design.md](../product/design.md) and [ui.md](ui.md); vendored fonts | |

**Data flow:** the host obtains a server-issued game ID, then reports `GameResult` → `POST /api/sessions` → `core` computes ★ and stat deltas → `db` writes in one transaction (bumps the family's `version`). The child polls `/api/state` and refreshes after mutations; only confirmed state updates its wallet/Brainy. The [contract](sessions.md) covers access, launch, snapshots, recovery and stopping. Demo interactions go through `POST /api/actions` → `applyShowcaseAction` (core) → one transaction; parent actions need the device PIN unlock (D-21).

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (latest stable at scaffold time), React, TypeScript strict |
| Styling / UI | Tailwind CSS 4 + **shadcn/ui on Base UI** (`@base-ui/react`) restyled with the lavender tokens (D-36), for child and parent; Lucide (parent/system) + custom SVGs (child) → [ui.md](ui.md) |
| Animation | CSS → React `<ViewTransition>` (routes, shared elements) → Motion `LazyMotion` (physics, gestures, rewards); Motion Primitives per component |
| Charts | Recharts |
| DB | **SQLite** via libSQL client + Drizzle ORM (`file:./data/dev.db`); `drizzle-kit push` / `studio` |
| Auth | Demo session first (seeded family, cookie) + parent PIN; Better Auth as a stretch goal |
| Live sync | Short polling via TanStack Query (~3 s, version check). Works locally and on serverless |
| Media | Files in `apps/web/public/media`, no object storage |
| Browser storage | UI preferences only; the server is the source of truth (parent needs live data) |
| PWA | Web app manifest (`app/manifest.ts`) and generated icons; no service worker |
| Fonts | Vendored Manrope (titles/UI), Unbounded (numbers) and Onest via `next/font/local` (OFL; `packages/ui/src/fonts/SOURCES.txt`) |
| Lint / format | Biome |
| Tests | Vitest (`core`, `brainy`, bridge, game rounds); asset-integrity script; Playwright in **Chromium + WebKit** (games, demo flow, acceptance criteria) |
| Games | React (default); embedded via iframe + bridge for Phaser (esbuild) and pinned static builds; GDevelop kit planned (T-106) |
| Game lab | dev-only `/lab` route in `apps/web` |
| Deploy | **Done (T-14):** Vercel Hobby (free) + Turso free libSQL via the same Drizzle driver; `DEMO_MODE=1` |

Own-domain constraint: [rules.md](../product/rules.md#technical-requirements). Agent tooling (skills, MCP): [agent-tooling.md](agent-tooling.md).
