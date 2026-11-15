// Reuse the workspace's existing TS runner; no new runtime dependency.
import { createRequire } from "node:module";

const require = createRequire(new URL("../packages/db/package.json", import.meta.url));
const { tsImport } = await import(require.resolve("tsx/esm/api"));
export const importTs = (path) => tsImport(path, import.meta.url);
