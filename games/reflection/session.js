// Brainee Reflection (Mirror Grid) learning session adapter.
// Uses upstream EaselJS stage and Sugarizer Reflection symmetry logic.

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const bridge = window.Brainee.connect({ contract: "reflection@1" });
await bridge.ready;

// Game-local copy. The platform is English-only.
const t = {
  title: "Mirror Grid",
  progress: (n) => `Pattern ${n} of 4`,
  vertical: "Color the right half as a mirror image of the left.",
  bilateral: "Color the other parts as mirror images of the sample.",
  wrong: "Not quite symmetrical yet. Try again!",
  next: "You did it! Build the next pattern.",
  done: "Great! All 4 patterns are done!",
  doneTitle: "All 4 patterns are done!",
  check: "Check",
  colors: ["white", "blue", "red"],
  dot: (x, y, color, sample) => `${sample ? "Sample" : "Dot"} ${x}, ${y}: ${color}`,
};
// A solved pattern stays on screen briefly; Check is ignored meanwhile, so a double tap cannot
// grade the next, still empty pattern.
const FEEDBACK_MS = 700;

const session = {
  level: Math.max(1, Math.min(3, Number(bridge.config?.level) || 1)),
  rounds: 0,
  mistakes: 0,
  corrections: 0,
  hadMistake: false,
  finished: false,
  started: performance.now(),
};

const rng = mulberry32((Number(bridge.config?.seed) || 42) + session.level * 100);

const gridWidth = session.level === 1 ? 4 : 6;
const gridHeight = session.level === 1 ? 4 : 6;
const isBilateral = session.level === 3;
const colors = session.level === 1 ? ["#FFFFFF", "#2563EB"] : ["#FFFFFF", "#2563EB", "#DC2626"];

// Pre-generate 4 deterministic tasks
function generateTasks() {
  const tasks = [];
  const sampleW = gridWidth / 2;
  const sampleH = isBilateral ? gridHeight / 2 : gridHeight;
  const totalSample = sampleW * sampleH;
  const minColored = Math.max(2, Math.floor(totalSample * 0.35));
  const maxColored = Math.floor(totalSample * 0.7);

  for (let task = 0; task < 4; task++) {
    const grid = Array.from({ length: gridWidth }, () => Array(gridHeight).fill(0));
    let colored = 0;
    while (colored < minColored) {
      for (let x = 0; x < sampleW; x++) {
        for (let y = 0; y < sampleH; y++) {
          if (rng() < 0.5 && colored < maxColored) {
            const col = 1 + Math.floor(rng() * (colors.length - 1));
            if (grid[x][y] === 0) {
              grid[x][y] = col;
              colored++;
            }
          }
        }
      }
    }
    tasks.push(grid);
  }
  return tasks;
}

const tasks = generateTasks();

// Current grid dot colors (x, y)
const currentGrid = Array.from({ length: gridWidth }, () => Array(gridHeight).fill(0));
let showingSmile = false;
let feedbackTimer = 0;

// DOM elements
const app = document.getElementById("game-app");
const canvas = document.getElementById("actualcanvas");
const overlay = document.getElementById("dots-overlay");
const progressEl = document.getElementById("session-progress");
const messageEl = document.getElementById("session-message");
const checkBtn = document.getElementById("check-btn");
const completeModal = document.getElementById("session-complete");
const container = document.getElementById("canvas-container");

document.title = t.title;
document.querySelector(".game-title").textContent = t.title;
completeModal.querySelector("h1").textContent = t.doneTitle;
checkBtn.textContent = t.check;

// The canvas is redrawn on demand only; there is no animation loop to keep alive.
const stage = new window.createjs.Stage(canvas);

// `data-turn` exposes the input state (play | feedback | done) without relying on copy.
function setTurn(turn) {
  app.setAttribute("data-turn", turn);
}

function isSampleDot(x, y) {
  if (isBilateral) {
    return x < gridWidth / 2 && y < gridHeight / 2;
  }
  return x < gridWidth / 2;
}

const layout = {
  canvasSize: 320,
  margin: 12,
  radius: 20,
  cellStep: 50,
  offsetX: 0,
  offsetY: 0,
};

function updateLayout() {
  const rect = container.getBoundingClientRect();
  const maxW = Math.min(rect.width || 360, 480);
  const maxH = Math.min(rect.height || 360, 480);
  const size = Math.floor(Math.min(maxW, maxH) - 16);

  layout.canvasSize = Math.max(280, size);
  canvas.width = layout.canvasSize;
  canvas.height = layout.canvasSize;

  layout.margin = Math.floor(layout.canvasSize / 24);
  const availW = layout.canvasSize - layout.margin * 2;
  const availH = layout.canvasSize - layout.margin * 2;
  layout.cellStep = Math.min(availW / gridWidth, availH / gridHeight);
  layout.radius = Math.max(16, (layout.cellStep - layout.margin) / 2);

  layout.offsetX = (layout.canvasSize - layout.cellStep * gridWidth) / 2;
  layout.offsetY = (layout.canvasSize - layout.cellStep * gridHeight) / 2;

  placeButtons();
  renderBoard();
}

function getDotCenter(x, y) {
  return {
    cx: layout.offsetX + (x + 0.5) * layout.cellStep,
    cy: layout.offsetY + (y + 0.5) * layout.cellStep,
  };
}

function showSmileShape(radius, colourHex) {
  const s = new window.createjs.Shape();
  const g = s.graphics;
  const scale = 150;
  const strokeColor =
    colourHex === "#000000" || colourHex === "#2563EB" || colourHex === "#DC2626"
      ? "#FFFFFF"
      : "#000000";

  g.setStrokeStyle((10 / scale) * radius, "round", "round");
  g.beginStroke(strokeColor);
  g.beginFill();
  g.drawCircle(0, 0, (100 / scale) * radius);
  g.beginFill();
  g.arc(0, 0, (60 / scale) * radius, 0, Math.PI);
  g.beginStroke();
  g.beginFill(strokeColor);
  g.drawCircle((-30 / scale) * radius, (-30 / scale) * radius, (15 / scale) * radius);
  g.drawCircle((30 / scale) * radius, (-30 / scale) * radius, (15 / scale) * radius);
  return s;
}

// One persistent DOM button per dot is the only input path. Buttons are created once and only
// moved on resize, so a tap never lands on an element that a previous tap replaced.
const buttons = [];
for (let x = 0; x < gridWidth; x++) {
  for (let y = 0; y < gridHeight; y++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `dot-btn${isSampleDot(x, y) ? " sample-dot" : ""}`;
    btn.dataset.x = String(x);
    btn.dataset.y = String(y);
    btn.disabled = isSampleDot(x, y);
    btn.addEventListener("click", () => cycleDotColor(x, y));
    overlay.appendChild(btn);
    buttons.push(btn);
  }
}

function placeButtons() {
  // At least 48px where the grid allows it, but never wider than one cell: overlapping
  // neighbours would steal taps near dot edges.
  const diameter = Math.min(Math.max(48, layout.radius * 2), layout.cellStep);
  for (const btn of buttons) {
    const { cx, cy } = getDotCenter(Number(btn.dataset.x), Number(btn.dataset.y));
    btn.style.left = `${cx - diameter / 2}px`;
    btn.style.top = `${cy - diameter / 2}px`;
    btn.style.width = `${diameter}px`;
    btn.style.height = `${diameter}px`;
  }
}

function syncButtons() {
  for (const btn of buttons) {
    const x = Number(btn.dataset.x);
    const y = Number(btn.dataset.y);
    const colorIdx = currentGrid[x][y];
    btn.dataset.color = String(colorIdx);
    btn.disabled = isSampleDot(x, y) || session.finished;
    btn.setAttribute("aria-label", t.dot(x + 1, y + 1, t.colors[colorIdx], isSampleDot(x, y)));
  }
}

function renderBoard() {
  stage.removeAllChildren();

  // Background plate
  const bg = new window.createjs.Shape();
  bg.graphics.beginFill("#F8FAFC").drawRoundRect(0, 0, layout.canvasSize, layout.canvasSize, 16);
  stage.addChild(bg);

  // Sample area subtle highlight
  const sampleHighlight = new window.createjs.Shape();
  sampleHighlight.graphics
    .beginFill("#EFF6FF")
    .drawRoundRect(
      layout.offsetX + 2,
      layout.offsetY + 2,
      layout.cellStep * (gridWidth / 2) - 4,
      layout.cellStep * (isBilateral ? gridHeight / 2 : gridHeight) - 4,
      12,
    );
  stage.addChild(sampleHighlight);

  // Mirror axis lines (prominent contrasting lines)
  const axisColor = "#1E293B";
  const axisWidth = 3;

  // Vertical mirror axis
  const vLine = new window.createjs.Shape();
  const midX = layout.offsetX + (gridWidth / 2) * layout.cellStep;
  vLine.graphics
    .setStrokeStyle(axisWidth, "round")
    .beginStroke(axisColor)
    .moveTo(midX, layout.offsetY)
    .lineTo(midX, layout.offsetY + gridHeight * layout.cellStep);
  stage.addChild(vLine);

  // Horizontal mirror axis if bilateral
  if (isBilateral) {
    const hLine = new window.createjs.Shape();
    const midY = layout.offsetY + (gridHeight / 2) * layout.cellStep;
    hLine.graphics
      .setStrokeStyle(axisWidth, "round")
      .beginStroke(axisColor)
      .moveTo(layout.offsetX, midY)
      .lineTo(layout.offsetX + gridWidth * layout.cellStep, midY);
    stage.addChild(hLine);
  }

  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      const { cx, cy } = getDotCenter(x, y);
      const colorIdx = currentGrid[x][y];
      const colorHex = colors[colorIdx];

      const circle = new window.createjs.Shape();
      circle.graphics
        .setStrokeStyle(1.5)
        .beginStroke(colorIdx === 0 ? "#CBD5E1" : colorHex)
        .beginFill(colorHex)
        .drawCircle(0, 0, layout.radius)
        .endFill();
      circle.x = cx;
      circle.y = cy;
      stage.addChild(circle);

      // Smile face on a solved pattern
      if (showingSmile) {
        const smile = showSmileShape(layout.radius, colorHex);
        smile.x = cx;
        smile.y = cy;
        stage.addChild(smile);
      }
    }
  }

  syncButtons();
  stage.update();
}

function cycleDotColor(x, y) {
  if (session.finished || showingSmile || isSampleDot(x, y)) return;
  currentGrid[x][y] = (currentGrid[x][y] + 1) % colors.length;
  renderBoard();
}

function loadTask(roundIndex) {
  showingSmile = false;
  const task = tasks[roundIndex];
  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      currentGrid[x][y] = isSampleDot(x, y) ? task[x][y] : 0;
    }
  }
  progressEl.textContent = t.progress(roundIndex + 1);
  messageEl.textContent = isBilateral ? t.bilateral : t.vertical;
  renderBoard();
  setTurn("play");
}

function checkSymmetry() {
  if (!isBilateral) {
    // Mode 0: Vertical mirror axis reflection
    for (let x = 0; x < gridWidth / 2; x++) {
      for (let y = 0; y < gridHeight; y++) {
        if (currentGrid[x][y] !== currentGrid[gridWidth - 1 - x][y]) {
          return false;
        }
      }
    }
    return true;
  }
  // Mode 2: Bilateral symmetry (vertical AND horizontal)
  for (let x = 0; x < gridWidth / 2; x++) {
    for (let y = 0; y < gridHeight / 2; y++) {
      const orig = currentGrid[x][y];
      if (
        orig !== currentGrid[gridWidth - 1 - x][y] ||
        orig !== currentGrid[x][gridHeight - 1 - y] ||
        orig !== currentGrid[gridWidth - 1 - x][gridHeight - 1 - y]
      ) {
        return false;
      }
    }
  }
  return true;
}

function onCheck() {
  if (session.finished || showingSmile) return;

  if (!checkSymmetry()) {
    session.mistakes++;
    session.hadMistake = true;
    messageEl.textContent = t.wrong;
    bridge.track("round", { correct: false, afterMistake: false });
    return;
  }

  bridge.track("round", { correct: true, afterMistake: session.hadMistake });
  session.rounds++;
  if (session.hadMistake) session.corrections++;
  session.hadMistake = false;
  showingSmile = true;

  if (session.rounds === 4) {
    session.finished = true;
    checkBtn.disabled = true;
    renderBoard();
    setTurn("done");
    messageEl.textContent = t.done;
    completeModal.style.display = "flex";
    bridge.track("finish", {
      gameId: "reflection",
      level: session.level,
      rounds: session.rounds,
      mistakes: session.mistakes,
      corrections: session.corrections,
      durationMs: Math.round(performance.now() - session.started),
    });
    return;
  }

  renderBoard();
  setTurn("feedback");
  messageEl.textContent = t.next;
  feedbackTimer = setTimeout(() => {
    if (!session.finished) loadTask(session.rounds);
  }, FEEDBACK_MS);
}

checkBtn.addEventListener("click", onCheck);

const onResize = () => updateLayout();
window.addEventListener("resize", onResize);

window.addEventListener(
  "pagehide",
  () => {
    session.finished = true;
    clearTimeout(feedbackTimer);
    window.removeEventListener("resize", onResize);
    stage.removeAllChildren();
    bridge.close();
  },
  { once: true },
);

// Initial start
updateLayout();
loadTask(0);
bridge.lifecycle("ready");
