import { buildPhaserPackage } from "../../packages/engine-phaser/buildPhaserPackage.mjs";

await buildPhaserPackage({ packageDir: import.meta.dirname });
