# Reflection (Mirror Grid) Integration Guide

This document specifies the exact steps for the integrator to register `reflection` in the shared catalog, build pipeline, and database.

## 1. Register Manifest in `packages/game-catalog/src/index.ts`

```typescript
import reflection from "../../../games/reflection/manifest.json" with { type: "json" };

// Add `reflection` to the exported manifests array:
export const manifests = [odd, pattern, puzzle, tangram, reflection].map((value) =>
  manifestSchema.parse(value),
);
```

## 2. Add Build Step in `scripts/build-games.mjs`

```javascript
import { buildGame as buildReflection } from "../games/reflection/build.mjs";

// After destination setup:
rmSync(`${destination}/reflection`, { recursive: true, force: true });
await buildReflection(`${destination}/reflection`);
```

## 3. Apply Schema & Seed Database

```bash
pnpm games:build
pnpm db:push
pnpm db:seed
```

## 4. Run Conformance and E2E Tests

```bash
pnpm check
pnpm test:assets
pnpm --filter @brainee/web test:e2e e2e/reflection.spec.ts
```
