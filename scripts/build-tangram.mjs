// biome-ignore-all lint/suspicious/noTemplateCurlyInString: patching literal upstream template source
import { cpSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Path C: retain pinned originals; apply the small host/session port only to the served copy.
export function buildTangram(destination) {
  const root = "games/tangram-tales";
  cpSync(`${root}/artifact`, destination, { recursive: true });
  cpSync(`${root}/index.html`, `${destination}/index.html`);
  cpSync(`${root}/session.css`, `${destination}/session.css`);
  cpSync(`${root}/CREDITS.md`, `${destination}/CREDITS.md`);
  cpSync(`${root}/manifest.json`, `${destination}/manifest.json`);
  let source = readFileSync(`${root}/artifact/js/main.js`, "utf8");
  source = source.replaceAll("../../../shared/", "../shared/");
  source = source.replace(
    "import { onTap } from '../shared/js/tap.js';",
    `function onTap(element, action) {
    element.addEventListener('click', action);
    return () => element.removeEventListener('click', action);
  }`,
  );
  source = source.replace(/^import .* (?:sfx|voice) from .*;\n/gm, "");
  source = source.replace(/^import .*(?:freeform-board|debug-harness|audio-unlock).*;\n/gm, "");
  source = source.slice(0, source.indexOf("function completeGuided()"));
  const replaceFunction = (name, body) => {
    const start = source.indexOf(`function ${name}(`);
    const end = source.indexOf("\nfunction ", start + 1);
    if (start < 0 || end < 0) throw new Error(`Missing upstream function: ${name}`);
    source = `${source.slice(0, start)}${body}\n${source.slice(end)}`;
  };
  source = source.replace("  muted: false,", "  muted: true,");
  source = source.replace(
    "voice.init('./assets/audio/manifest.json', './assets/audio/lines.json', config.voice)",
    "Promise.resolve()",
  );
  source = source.replace("installKioskGuards();", "");
  source = source.replace(
    "installUnlockOnGesture({ onFirst: () => { if (state.screen === 'splash') say('welcome'); } });",
    "",
  );
  source = `const voice = { stop() {}, say() {}, setMuted() {} };\nconst sfx = {};\nfunction unlockAll() {}\n${source}`;
  replaceFunction("hud", "function hud() { return ''; }");
  // Original guided puzzles pre-place three pieces. Increase the unplaced set with difficulty.
  source = source.replace(".slice(0, 4)", ".slice(0, session.level + 3)");
  source = source.replaceAll("${esc(tale.prompt)}", "Собери силуэт");
  source = source.replace(
    "${placedCount} of 7 pieces placed",
    "Размещено ${placedCount} из 7 деталей",
  );
  source = source.replace("<span>of 7</span>", "<span>из 7</span>");
  source = source.replace("${esc(tale.title)} tangram outline", "Силуэт для деталей");
  source = source.replace("Paper pieces to place", "Детали для силуэта");
  source = source.replace("Matching spot for a ${esc(source.shape)}", "Место для детали");
  source = source.replace("${esc(piece.label)}, placed", "Размещённая деталь");
  source = source.replace(
    "${esc(piece.label)}. Drag it, hold to turn it, or tap then tap its spot.",
    "${esc(piece.label)}. Нажми на деталь, затем на её место.",
  );
  source = source.replace(
    '      <header class="play-heading">',
    '      <header class="play-heading"><p class="session-progress">Силуэт ${session.rounds + 1} из 4</p>',
  );
  source = source.replace(
    "      </div>\n    </section>`;\n  wireActions();\n  wireGuidedPieces();",
    '      </div><footer class="session-footer"><p role="status">${session.message}</p><button data-action="check">Проверить</button></footer>\n    </section>`;\n  wireActions();\n  wireGuidedPieces();',
  );
  source = source.replace(
    'class="board-object slot ',
    'class="board-object slot ${state.selectedPiece && matchingOpenSlots(state.selectedPiece).includes(slotId) ? "selected-family" : ""} ',
  );
  // Placement still uses upstream family matching (interchangeable equal triangles), and snapping.
  source = source.replace(
    / {2}if \(Object.keys\(state.placements\).length === 7\) \{\n {4}revealTimer = later\(\(\) => showReveal\(state.tale\), 620\);\n {2}\}/,
    "",
  );
  replaceFunction(
    "wireGuidedPieces",
    `function wireGuidedPieces() {
    document.querySelectorAll('.tray-piece').forEach((button) => {
      disposers.push(onTap(button, () => {
        state.selectedPiece = button.dataset.piece;
        renderGuided();
      }));
    });
  }`,
  );
  replaceFunction("armIdle", "function armIdle() {}");
  replaceFunction("showReveal", "function showReveal() { checkRound(); }");
  replaceFunction(
    "handleAction",
    `function handleAction(action, value, event) {
    if (session.finished || state.screen !== 'guided') return false;
    if (action === 'check') return checkRound();
    if (action === 'slot' && state.selectedPiece) return attemptPlace(state.selectedPiece, null, value);
    return false;
  }`,
  );
  replaceFunction("loadJson", "function loadJson(key, fallback) { return fallback; }");
  // Last function has no successor after debug code removal.
  source = `${source.slice(0, source.indexOf("function saveJson("))}function saveJson() {}\n`;
  // Ship only the guided path: upstream authoring/debug/free-mode entry points are absent.
  for (const [from, to] of [
    ["function showSplash(", "function randomizedInitialPlacements("],
    ["function previewTargetFor(", "function wireGuidedPieces("],
    ["function clearGuidedHold(", "function matchingOpenSlots("],
    ["function highlightNearest(", "function nearestSlot("],
    ["function showReveal(", "function wireActions("],
    ["function toggleSound(", "function objectStyle("],
    ["function plateButton(", "function loadJson("],
  ]) {
    const start = source.indexOf(from),
      end = source.indexOf(to, start);
    if (start < 0 || end < 0) throw new Error(`Missing guided boundary ${from}`);
    source = source.slice(0, start) + source.slice(end);
  }
  source = source.replace("  guidedDragCtl.detach();", "");
  source = source.replace(/^import .*drag-to-slot-dom.*;\n/gm, "");
  source += readFileSync(`${root}/session.js`, "utf8");
  writeFileSync(resolve(destination, "js/main.js"), source);
  // Translate only labels actually used by the guided UI; no English voice is loaded or played.
  const config = JSON.parse(readFileSync(`${destination}/config.json`, "utf8"));
  const labels = [
    "Большой коралловый треугольник",
    "Большой синий треугольник",
    "Средний оранжевый треугольник",
    "Маленький фиолетовый треугольник",
    "Маленький бирюзовый треугольник",
    "Жёлтый квадрат",
    "Зелёный параллелограмм",
  ];
  config.pieces.forEach((piece, index) => {
    piece.label = labels[index];
  });
  writeFileSync(`${destination}/config.json`, JSON.stringify(config));
}
