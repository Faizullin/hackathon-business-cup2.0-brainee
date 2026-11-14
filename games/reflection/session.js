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

const session = {
  level: Math.max(1, Math.min(3, Number(bridge.config?.level) || 1)),
  rounds: 0,
  mistakes: 0,
  corrections: 0,
  hadMistake: false,
  finished: false,
  started: performance.now(),
  message: "Раскрась вторую половину как зеркальное отражение.",
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

  for (let t = 0; t < 4; t++) {
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

// DOM elements
const canvas = document.getElementById("actualcanvas");
const overlay = document.getElementById("dots-overlay");
const progressEl = document.getElementById("session-progress");
const messageEl = document.getElementById("session-message");
const checkBtn = document.getElementById("check-btn");
const completeModal = document.getElementById("session-complete");
const container = document.getElementById("canvas-container");

// EaselJS Stage setup
const stage = new window.createjs.Stage(canvas);
stage.mouseEventsEnabled = true;
window.createjs.Ticker.setFPS(30);
window.createjs.Ticker.addEventListener("tick", () => stage.update());

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

function renderBoard() {
  stage.removeAllChildren();
  overlay.innerHTML = "";

  // Background plate
  const bg = new window.createjs.Shape();
  bg.graphics.beginFill("#F8FAFC").drawRoundRect(0, 0, layout.canvasSize, layout.canvasSize, 16);
  stage.addChild(bg);

  // Sample area subtle highlight
  const sampleHighlight = new window.createjs.Shape();
  if (isBilateral) {
    sampleHighlight.graphics
      .beginFill("#EFF6FF")
      .drawRoundRect(
        layout.offsetX + 2,
        layout.offsetY + 2,
        layout.cellStep * (gridWidth / 2) - 4,
        layout.cellStep * (gridHeight / 2) - 4,
        12,
      );
  } else {
    sampleHighlight.graphics
      .beginFill("#EFF6FF")
      .drawRoundRect(
        layout.offsetX + 2,
        layout.offsetY + 2,
        layout.cellStep * (gridWidth / 2) - 4,
        layout.cellStep * gridHeight - 4,
        12,
      );
  }
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

  // Draw dots and wire overlay buttons
  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      const { cx, cy } = getDotCenter(x, y);
      const isSample = isSampleDot(x, y);
      const colorIdx = currentGrid[x][y];
      const colorHex = colors[colorIdx];

      // EaselJS circle shape
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

      // Smile face on completed round
      if (showingSmile) {
        const smile = showSmileShape(layout.radius, colorHex);
        smile.x = cx;
        smile.y = cy;
        stage.addChild(smile);
      }

      // DOM Overlay Button for accessibility, touch, and reliable testing
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `dot-btn${isSample ? " sample-dot" : ""}`;
      btn.dataset.x = String(x);
      btn.dataset.y = String(y);
      btn.dataset.color = String(colorIdx);
      btn.setAttribute("aria-label", `Точка ${x}, ${y}: цвет ${colorIdx}`);

      const diameter = Math.max(48, layout.radius * 2);
      btn.style.left = `${cx - diameter / 2}px`;
      btn.style.top = `${cy - diameter / 2}px`;
      btn.style.width = `${diameter}px`;
      btn.style.height = `${diameter}px`;

      if (isSample || session.finished) {
        btn.disabled = true;
      } else {
        btn.addEventListener("click", () => cycleDotColor(x, y));
        circle.on("click", () => cycleDotColor(x, y));
      }

      overlay.appendChild(btn);
    }
  }

  stage.update();
}

function cycleDotColor(x, y) {
  if (session.finished || isSampleDot(x, y)) return;
  currentGrid[x][y] = (currentGrid[x][y] + 1) % colors.length;
  showingSmile = false;
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
  progressEl.textContent = `Узор ${roundIndex + 1} из 4`;
  session.message = isBilateral
    ? "Раскрась остальные части как зеркальное отражение образца."
    : "Раскрась правую половину как зеркальное отражение левой.";
  messageEl.textContent = session.message;
  renderBoard();
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
  if (session.finished) return;

  const correct = checkSymmetry();
  if (!correct) {
    session.mistakes++;
    session.hadMistake = true;
    session.message = "Пока не совсем симметрично. Попробуй ещё раз!";
    messageEl.textContent = session.message;
    bridge.track("round", { correct: false, afterMistake: false });
    return;
  }

  // Correct pattern completed!
  bridge.track("round", { correct: true, afterMistake: session.hadMistake });
  session.rounds++;
  if (session.hadMistake) session.corrections++;
  session.hadMistake = false;

  if (session.rounds === 4) {
    session.finished = true;
    checkBtn.disabled = true;
    showingSmile = true;
    renderBoard();
    session.message = "Отлично! Все 4 узора готовы!";
    messageEl.textContent = session.message;
    completeModal.style.display = "flex";
    bridge.track("finish", {
      gameId: "reflection",
      level: session.level,
      rounds: session.rounds,
      mistakes: session.mistakes,
      corrections: session.corrections,
      durationMs: Math.round(performance.now() - session.started),
    });
  } else {
    session.message = "Получилось! Собери следующий узор.";
    messageEl.textContent = session.message;
    loadTask(session.rounds);
  }
}

checkBtn.addEventListener("click", onCheck);

window.addEventListener("resize", () => {
  updateLayout();
});

window.addEventListener(
  "pagehide",
  () => {
    session.finished = true;
    window.createjs.Ticker.removeAllEventListeners("tick");
    stage.removeAllChildren();
    bridge.close();
  },
  { once: true },
);

// Initial start
updateLayout();
loadTask(0);
bridge.lifecycle("ready");
