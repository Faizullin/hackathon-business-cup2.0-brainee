// First `pnpm dev` on a fresh clone: build the embedded games and create the seeded
// local database when they are missing. Existing builds and data are left untouched.
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const run = (command) => execSync(command, { stdio: "inherit" });

if (!existsSync(new URL("../apps/web/public/games", import.meta.url))) run("pnpm games:build");
run("pnpm db:prepare");

const envFile = new URL("../apps/web/.env.local", import.meta.url);
const demoInFile = existsSync(envFile) && /^DEMO_MODE=1\s*$/m.test(readFileSync(envFile, "utf8"));
if (process.env.DEMO_MODE !== "1" && !demoInFile) {
  console.warn(
    "\nDEMO_MODE is off: every child/parent screen will show “Could not load Brainy”.\n" +
      "Run `pnpm demo`, or set DEMO_MODE=1 in apps/web/.env.local (see .env.example).\n",
  );
}
