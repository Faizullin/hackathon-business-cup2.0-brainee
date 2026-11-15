# Conventions

## Language
- Code, identifiers, comments, docs, commits: **English**.
- UI text: **English only** (host and games). Host strings live in `apps/web/src/i18n/en.ts`; games keep their copy in their own wrapper.

## Code
- TypeScript `strict`; no `any` without a comment explaining why.
- Business rules go only in `packages/core` and must be pure and unit-tested. See [architecture.md](architecture.md#package-responsibilities).
- Games follow the contract in [games.md](games.md).
- Name things after the PRD: `stars`, `suns`, `mood`, `stage`, `resp`, the `brain|eyes|mouth|arms|legs` stats.
- Currencies are integers. Never store ★ and ☀ in one field without a currency tag.
- No URLs to foreign domains in the client. Assets go in `public/media` or the game's `assets/`.
- Components: `PascalCase.tsx`; everything else: `kebab-case.ts`. Copied shadcn primitives keep their upstream kebab-case filenames.
- Lint and format with **Biome** (`pnpm check`). No ESLint or Prettier.

## Data
- Schema changes: edit `packages/db/schema.ts` → `pnpm db:reset`. No migration files until after the hackathon.
- Every new table or field gets seed data, so the demo never shows an empty screen.

## Testing
- Every function in `core` gets Vitest cases covering the PRD's numbers (first try +3★, corrected +4★, 3-in-a-row +5★…).
- Every game's `generateRounds` gets a seeded test.
- Main flows and every game get a Playwright spec in Chromium **and WebKit** (the iPad engine). Assert on the bridge status (`data-status`), not page text. Rebuild games before e2e.
- Before a demo, run the [acceptance criteria](../product/rules.md#mvp-acceptance-criteria).

## Git
- **Workflow:** feature branch → pull request into `master` (`feature/<name>`). Don't push to `master` directly and don't merge your own PR; the team reviews it.
- Commits: Conventional Commits (`feat(core): add star rules [T-21]`), with the task ID from [todo.md](../progress/todo.md). No `Co-Authored-By` trailers and no tool-attribution lines in commits or PR descriptions.
- Keep `master` deployable.
- Personal commit/push and chat-handoff preferences: `.local/notes.md` (gitignored), if present.

## Docs
Upkeep rules: [docs/README.md](../README.md#upkeep). Agent skills: [agent-tooling.md](agent-tooling.md).
