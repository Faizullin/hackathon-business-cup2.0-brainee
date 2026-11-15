// Port of GSP's manifest + ZIP publisher, without its PECS API dependency.
import { build } from "esbuild";

try {
  process.loadEnvFile(".env.r2");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const bundle = await build({
  entryPoints: ["scripts/publish-remote.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const { main } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);
try {
  await main(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
