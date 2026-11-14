# Rhythm Copycat Integration Guide

This game is self-contained in `games/rhythm-copycat/` and exports a standard build module.

## 1. Catalog Registration
In `packages/game-catalog/src/index.ts`:
```ts
import rhythmCopycat from "../../../games/rhythm-copycat/manifest.json" with { type: "json" };

// Append to manifests array:
export const manifests = [
  // ... existing manifests
  rhythmCopycat,
].map((value) => manifestSchema.parse(value));
```

## 2. Static Build Integration
In `scripts/build-games.mjs`:
```js
import { buildGame as buildRhythmCopycat } from "../games/rhythm-copycat/build.mjs";

// Add build step:
rmSync(`${destination}/rhythm-copycat`, { recursive: true, force: true });
buildRhythmCopycat(`${destination}/rhythm-copycat`);
```

## 3. Database Catalog Seed
In `packages/db/src/seed.ts` (when registering in database catalog):
Game entry matches `games/rhythm-copycat/manifest.json`.

## 4. Host i18n
In `apps/web/src/i18n/ru.ts`:
```ts
"rhythm-copycat": {
  title: "Ритм-повторялка",
  description: "Повтори ритм за Кики: хлопай, топай, стучи и держи ритм!",
}
```

## 5. Build & Verification
Run build:
```sh
node -e 'import("./games/rhythm-copycat/build.mjs").then(m => m.buildGame("apps/web/public/games/rhythm-copycat"))'
```
Verification:
```sh
pnpm check
pnpm test:assets
```
