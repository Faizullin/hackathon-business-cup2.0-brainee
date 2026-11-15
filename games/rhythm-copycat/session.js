import * as perc from "./js/percussion.js";

const bridge = window.Brainee.connect({ contract: "rhythm-copycat@1" });
await bridge.ready;

const session = {
  level: Math.max(1, Math.min(3, Number(bridge.config?.level) || 1)),
  seed: Number(bridge.config?.seed) || 42,
  rounds: 0,
  mistakes: 0,
  corrections: 0,
  hadMistake: false,
  finished: false,
  started: performance.now(),
  soundEnabled: true,
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ACTIONS = ["clap", "stomp", "tap", "shake"];
const ACTION_COLORS = {
  clap: "#4f8fd8",
  stomp: "#6cb232",
  tap: "#e88a2d",
  shake: "#e8543f",
};
const ACTION_CHIPS = {
  clap: "./assets/pads/clap.webp",
  stomp: "./assets/pads/stomp.webp",
  tap: "./assets/pads/tap.webp",
  shake: "./assets/pads/shake.webp",
};

// Generate 4 deterministic patterns for this session
function createPattern(level, roundIndex) {
  const roundRng = mulberry32(session.seed + roundIndex * 79 + level * 17);
  const pickAction = () => ACTIONS[Math.floor(roundRng() * ACTIONS.length)];

  if (level === 1) {
    // Level 1: 5 beats, ordinary tempo
    const p = [];
    for (let i = 0; i < 5; i++) p.push(pickAction());
    return p;
  }
  if (level === 2) {
    // Level 2: 6 beats with repeating chunks
    const chunk = [pickAction(), pickAction(), pickAction()];
    // Either chunk repeated or chunk + variant
    return [...chunk, chunk[0], chunk[1], pickAction()];
  }
  // Level 3: 8 beats with rhythmic structure
  const a = pickAction();
  const b = pickAction();
  const c = pickAction();
  const d = pickAction();
  return [a, b, a, b, c, c, d, d];
}

const patterns = [
  createPattern(session.level, 0),
  createPattern(session.level, 1),
  createPattern(session.level, 2),
  createPattern(session.level, 3),
];

// DOM references
const promptEl = document.querySelector("[data-prompt]");
const chipsHost = document.querySelector("[data-chips]");
const trayEl = document.querySelector(".rc-tray");
const progressEl = document.querySelector(".session-progress");
const messageEl = document.querySelector(".session-message");
const soundBtn = document.querySelector("[data-action='toggle-sound']");
const replayBtn = document.querySelector("[data-action='listen']");
const pads = document.querySelectorAll(".rc-pad");
const kikiImg = document.querySelector("[data-kiki-img]");
const mainGame = document.getElementById("game");

let currentPattern = patterns[0];
let currentInput = [];
let isDemoPlaying = false;
let isAcceptingInput = false;
let demoTimeouts = [];

function clearDemoTimeouts() {
  demoTimeouts.forEach(clearTimeout);
  demoTimeouts = [];
}

function setKikiPose(pose) {
  if (kikiImg) {
    kikiImg.src = `./assets/kiki/poses/${pose}.webp`;
  }
}

function updateProgress() {
  if (progressEl) {
    progressEl.textContent = `Ритм ${session.rounds + 1} из 4`;
  }
}

function renderChips(pattern, filledCount = 0, filledActions = []) {
  if (!chipsHost || !trayEl) return;
  const len = pattern.length;
  for (let n = 2; n <= 8; n++) {
    trayEl.classList.toggle(`rc-tray-len${n}`, len === n);
  }
  chipsHost.replaceChildren();
  pattern.forEach((action, i) => {
    const chip = document.createElement("span");
    const isFilled = i < filledCount;
    const act = isFilled ? filledActions[i] : action;
    chip.className = `rc-chip ${isFilled ? "is-shown" : "is-socket"}`;
    chip.dataset.index = String(i);
    chip.style.setProperty("--chip-color", ACTION_COLORS[act] || "#2dd2d3");

    const img = document.createElement("img");
    img.src = ACTION_CHIPS[act] || "./assets/pads/clap.webp";
    img.alt = act;
    img.draggable = false;
    chip.append(img);
    chipsHost.append(chip);
  });
}

function highlightChip(index, action) {
  const chip = chipsHost?.querySelector(`[data-index="${index}"]`);
  if (!chip) return;
  chip.className = "rc-chip is-shown is-active is-beat";
  chip.style.setProperty("--chip-color", ACTION_COLORS[action] || "#2dd2d3");
  const img = chip.querySelector("img");
  if (img) img.src = ACTION_CHIPS[action];
}

function flashPad(action) {
  const pad = document.querySelector(`.rc-pad[data-pad="${action}"]`);
  if (!pad) return;
  pad.classList.remove("is-demo-hit", "is-hit");
  void pad.offsetWidth;
  pad.classList.add(isDemoPlaying ? "is-demo-hit" : "is-hit");
  setTimeout(() => pad.classList.remove("is-demo-hit", "is-hit"), 420);
}

function playActionSound(action) {
  if (session.soundEnabled) {
    perc.play(action);
  }
}

async function playDemo() {
  if (session.finished) return;
  clearDemoTimeouts();
  isDemoPlaying = true;
  isAcceptingInput = false;
  currentInput = [];
  setKikiPose("neutral");
  if (promptEl) promptEl.textContent = "Слушай и смотри!";
  if (messageEl) messageEl.textContent = "Внимательно запоминай последовательность";
  renderChips(currentPattern, 0, []);

  const beatMs = 640;
  for (let i = 0; i < currentPattern.length; i++) {
    await new Promise((resolve) => {
      const t = setTimeout(
        () => {
          if (session.finished) return resolve();
          const act = currentPattern[i];
          highlightChip(i, act);
          flashPad(act);
          setKikiPose(act);
          playActionSound(act);
          resolve();
        },
        i === 0 ? 400 : beatMs,
      );
      demoTimeouts.push(t);
    });
  }

  await new Promise((resolve) => {
    const t = setTimeout(() => {
      setKikiPose("neutral");
      isDemoPlaying = false;
      isAcceptingInput = true;
      if (promptEl) promptEl.textContent = "Твоя очередь!";
      if (messageEl) messageEl.textContent = "Повтори ритм на площадках!";
      renderChips(currentPattern, 0, []);
      resolve();
    }, 500);
    demoTimeouts.push(t);
  });
}

function handlePadInput(action) {
  if (session.finished || isDemoPlaying || !isAcceptingInput) return;
  playActionSound(action);
  flashPad(action);
  setKikiPose(action);
  setTimeout(() => {
    if (!isDemoPlaying && isAcceptingInput) setKikiPose("neutral");
  }, 400);

  currentInput.push(action);
  renderChips(currentPattern, currentInput.length, currentInput);

  if (currentInput.length === currentPattern.length) {
    isAcceptingInput = false;
    checkSequence();
  }
}

function checkSequence() {
  const isMatch = currentInput.every((act, i) => act === currentPattern[i]);

  if (isMatch) {
    // Completed task!
    isAcceptingInput = false;
    if (promptEl) promptEl.textContent = "Отлично!";
    if (messageEl) messageEl.textContent = "Отлично! Следующий ритм.";
    setKikiPose("celebrate");
    if (session.soundEnabled) perc.play("strum");
    const wasAfterMistake = session.hadMistake;
    session.rounds++;
    if (wasAfterMistake) session.corrections++;
    session.hadMistake = false;
    updateProgress();
    bridge.track("round", { correct: true, afterMistake: wasAfterMistake });

    if (session.rounds === 4) {
      session.finished = true;
      clearDemoTimeouts();
      if (promptEl) promptEl.textContent = "Отлично!";
      if (messageEl) messageEl.textContent = "Все 4 ритма выполнены!";
      if (mainGame) {
        mainGame.innerHTML = `
          <div class="session-complete">
            <h1>Все 4 ритма выполнены!</h1>
            <p>Ты отлично справился с ритмическими узорами!</p>
          </div>
        `;
      }
      bridge.track("finish", {
        gameId: "rhythm-copycat",
        level: session.level,
        rounds: session.rounds,
        mistakes: session.mistakes,
        corrections: session.corrections,
        durationMs: Math.round(performance.now() - session.started),
      });
      return;
    }

    if (promptEl) promptEl.textContent = "Отлично!";
    if (messageEl) messageEl.textContent = "Отлично! Следующий ритм.";
    updateProgress();
    setTimeout(() => {
      if (session.finished) return;
      currentPattern = patterns[session.rounds];
      playDemo();
    }, 1100);
  } else {
    // Failed complete sequence: counts as one attempt
    session.mistakes++;
    session.hadMistake = true;
    isAcceptingInput = false;
    if (promptEl) promptEl.textContent = "Слушай и смотри!";
    if (messageEl) messageEl.textContent = "Не совсем так. Давай повторим показ!";
    setKikiPose("notice");
    bridge.track("round", { correct: false, afterMistake: false });

    setTimeout(() => {
      if (session.finished) return;
      playDemo();
    }, 1200);
  }
}

// Sound is on by default; browsers only allow audio after a gesture,
// so unlock the AudioContext on the child's first touch or key press.
const unlockOnGesture = () => {
  if (session.soundEnabled) perc.unlock();
};
window.addEventListener("pointerdown", unlockOnGesture, { capture: true, once: true });
window.addEventListener("keydown", unlockOnGesture, { capture: true, once: true });

// Sound toggle
if (soundBtn) {
  soundBtn.addEventListener("click", () => {
    session.soundEnabled = !session.soundEnabled;
    if (session.soundEnabled) {
      perc.unlock();
      soundBtn.classList.add("is-active");
      soundBtn.textContent = "Звук: вкл";
    } else {
      soundBtn.classList.remove("is-active");
      soundBtn.textContent = "Звук: выкл";
    }
  });
}

// Replay button
if (replayBtn) {
  replayBtn.addEventListener("click", () => {
    if (isAcceptingInput && !isDemoPlaying && !session.finished) {
      playDemo();
    }
  });
}

// Wire pads
pads.forEach((pad) => {
  pad.addEventListener("click", () => {
    const action = pad.dataset.pad;
    if (action) handlePadInput(action);
  });
});

window.addEventListener(
  "pagehide",
  () => {
    session.finished = true;
    clearDemoTimeouts();
    bridge.close();
  },
  { once: true },
);

// Start
updateProgress();
await playDemo();
bridge.lifecycle("ready");
