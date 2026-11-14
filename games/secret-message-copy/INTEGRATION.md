# Secret Message Lab Integration Guide

This game is self-contained in `games/secret-message-copy/` and exports a standard build module.

## 1. Catalog Registration
In `packages/game-catalog/src/index.ts`:
```ts
import secretMessageCopy from "../../../games/secret-message-copy/manifest.json" with { type: "json" };

// Append to manifests array:
export const manifests = [
  // ... existing manifests
  secretMessageCopy,
].map((value) => manifestSchema.parse(value));
```

## 2. Static Build Integration
In `scripts/build-games.mjs`:
```js
import { buildGame as buildSecretMessageCopy } from "../games/secret-message-copy/build.mjs";

// Add build step:
rmSync(`${destination}/secret-message-copy`, { recursive: true, force: true });
buildSecretMessageCopy(`${destination}/secret-message-copy`);
```

## 3. Database Catalog Seed
In `packages/db/src/seed.ts` (when registering in database catalog):
Game entry matches `games/secret-message-copy/manifest.json`.

## 4. Host i18n
In `apps/web/src/i18n/ru.ts`:
```ts
"secret-message-copy": {
  title: "Секретное послание",
  description: "Запоминай секретные знаки, восстанавливай послания и помогай сове-курьеру!",
}
```

## 5. Build & Verification
Run build:
```sh
node -e 'import("./games/secret-message-copy/build.mjs").then(m => m.buildGame("apps/web/public/games/secret-message-copy"))'
```
Verification:
```sh
pnpm check
pnpm test:assets
```
