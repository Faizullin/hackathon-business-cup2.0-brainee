import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function buildGame(destination) {
  const dest = resolve(destination);
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });

  // 1. Copy immutable upstream artifact files
  cpSync(resolve(__dirname, "artifact"), dest, { recursive: true });

  // 2. Copy preview metadata, credits, adapter and wrapper
  cpSync(resolve(__dirname, "preview.json"), resolve(dest, "preview.json"));
  cpSync(resolve(__dirname, "manifest.json"), resolve(dest, "manifest.json"));
  cpSync(resolve(__dirname, "CREDITS.md"), resolve(dest, "CREDITS.md"));
  cpSync(resolve(__dirname, "wrapper.css"), resolve(dest, "wrapper.css"));
  cpSync(resolve(__dirname, "adapter.js"), resolve(dest, "adapter.js"));

  // 3. Patch js/main.js to point to local shared, prevent autoplay, and route home to host exit
  let mainJs = readFileSync(resolve(dest, "js/main.js"), "utf8");
  mainJs = mainJs.replaceAll("../../../shared/", "../shared/");
  // Audio only on intentional interaction, no autoplay
  mainJs = mainJs.replace("let muted = false;", "let muted = true;");
  // Route in-game splash home button to host exit instead of external ../../
  mainJs = mainJs.replace(
    "if (splash) window.location.href = '../../';",
    "if (splash) { document.querySelector('.brainee-host-exit')?.click(); return; }",
  );
  // Disable kiosk guards and debug auto-attach cleanly
  mainJs = mainJs.replace("installKioskGuards()", "(() => () => {})()");
  mainJs = mainJs.replace(
    /import\s*\{\s*installDebug\s*\}\s*from\s*['"][^'"]+['"];?/,
    "const installDebug = () => () => {};",
  );
  writeFileSync(resolve(dest, "js/main.js"), mainJs, "utf8");

  // 4. Clean shared/css/base.css from missing font-face references
  const baseCssPath = resolve(dest, "shared/css/base.css");
  if (readFileSync(baseCssPath, "utf8").includes("@font-face")) {
    let baseCss = readFileSync(baseCssPath, "utf8");
    baseCss = baseCss.replace(/@font-face\s*\{[^}]*\}/g, "");
    writeFileSync(baseCssPath, baseCss, "utf8");
  }

  // 5. Build index.html with host header banner, adapter and same-origin assets
  const htmlPath = resolve(dest, "index.html");
  let html = readFileSync(htmlPath, "utf8");
  // Clean favicon/apple-touch-icon foreign/missing paths
  html = html.replace(/<link rel="(?:icon|apple-touch-icon)"[^>]*>\s*/g, "");
  // Remove analytics script
  html = html.replace(/<script src="[^"]*analytics\.js"><\/script>\s*/g, "");
  // Fix shared CSS links
  html = html.replaceAll("../../shared/css/", "./shared/css/");
  // Add wrapper CSS and bridge/adapter scripts
  html = html.replace(
    '<link rel="stylesheet" href="./css/style.css" />',
    '<link rel="stylesheet" href="./css/style.css" />\n  <link rel="stylesheet" href="./wrapper.css" />\n  <script src="../bridge.js"></script>',
  );
  // Inject host bar before <main id="game">
  const hostBar = `
  <header class="brainee-host-bar" data-testid="host-bar" role="banner">
    <button type="button" class="brainee-host-exit" data-testid="host-exit-button" aria-label="Выйти из свободной игры">
      <span aria-hidden="true">‹</span>
      <span>Выход</span>
    </button>
    <div class="brainee-host-badge" data-testid="host-badge">
      Свободная игра · без звёзд
    </div>
    <div class="brainee-host-title" data-testid="host-title">
      Neighborhood Route Planner
    </div>
  </header>`;

  html = html.replace('<main id="game"', `${hostBar}\n  <main id="game"`);
  html = html.replace(
    '<script type="module" src="./js/main.js"></script>',
    '<script type="module" src="./js/main.js"></script>\n  <script type="module" src="./adapter.js"></script>',
  );

  writeFileSync(htmlPath, html, "utf8");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dest =
    process.argv[2] || resolve(__dirname, "../../apps/web/public/games/neighborhood-map-walk");
  await buildGame(dest);
  console.log(`Built neighborhood-map-walk to ${dest}`);
}
