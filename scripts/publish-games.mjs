import { importTs } from "./tsx-import.mjs";

try {
  const { main } = await importTs("./publish-target.ts");
  await main(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
