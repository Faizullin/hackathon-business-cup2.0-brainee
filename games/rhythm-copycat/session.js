import * as perc from "./js/percussion.js";

const bridge = window.Brainee.connect({ contract: "rhythm-copycat@1" });
await bridge.ready;

// Game-local copy. The platform is English-only.
const t = {
  title: "Rhythm Copycat",
  progress: (n) => `Rhythm ${n} of 4`,
  soundOn: "Sound: on",
  soundOff: "Sound: off",
  watch: "Listen and watch!",
  watchHint: "Remember the sequence carefully",
  turn: "Your turn!",
  turnHint: "Repeat the rhythm on the pads!",
  great: "Great!",
  next: "Great! Next rhythm.",
  wrong: "Not quite. Let's watch it again!",
  doneTitle: "All 4 rhythms done!",
  doneText: "Your rhythms sounded great!",
  pads: "Rhythm pads",
  replay: "AGAIN",
  replayLabel: "Replay the rhythm",
  kiki: "Kiki",
  actions: {
    clap: ["Clap", "Clap"],
    stomp: ["Stomp", "Stomp"],
    tap: ["Tap", "Tap"],
    shake: ["Shake", "Shake"],
  },
};

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
    return [...chunk, chunk[0], chunk[1], pickAction()];
  }
  // Level 3: 8 beats with rhythmic structure
  const a = pickAction();
  const b = pickAction();
  const c = pickAction();
  const d = pickAction();
  return [a, b, a, b, c, c, d, d];
}

const patterns = [0, 1, 2, 3].map((round) => createPattern(session.level, round));

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

function applyStaticText() {
  document.title = t.title;
  document.querySelector(".rc-pads")?.setAttribute("aria-label", t.pads);
  for (const pad of pads) {
    const [label, name] = t.actions[pad.dataset.pad] ?? [];
    if (!label) continue;
    pad.setAttribute("aria-label", name);
    const labelEl = pad.querySelector(".rc-pad-label");
    if (labelEl) labelEl.textContent = label;
  }
  replayBtn?.setAttribute("aria-label", t.replayLabel);
  const replayText = replayBtn?.querySelector("span");
  if (replayText) replayText.textContent = t.replay;
  if (kikiImg) kikiImg.alt = t.kiki;
  if (soundBtn) soundBtn.textContent = session.soundEnabled ? t.soundOn : t.soundOff;
}

let currentPattern = patterns[0];
let currentInput = [];
let isDemoPlaying = false;
let isAcceptingInput = false;
// Every pending timer, so leaving the game stops demos, flashes and round transitions.
const timers = new Set();

function later(fn, ms) {
  const id = setTimeout(() => {
    timers.delete(id);
    if (!session.finished) fn();
  }, ms);
  timers.add(id);
  return id;
}

function clearTimers() {
  for (const id of timers) clearTimeout(id);
  timers.clear();
}

// `data-turn` exposes the input state (demo | player | feedback | done) without relying on copy.
function setTurn(turn) {
  mainGame?.setAttribute("data-turn", turn);
}

function setText(prompt, message) {
  if (promptEl) promptEl.textContent = prompt;
  if (messageEl) messageEl.textContent = message;
}

function setKikiPose(pose) {
  if (kikiImg) kikiImg.src = `./assets/kiki/poses/${pose}.webp`;
}

function updateProgress() {
  if (progressEl) progressEl.textContent = t.progress(Math.min(session.rounds + 1, 4));
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
    img.alt = isFilled ? (t.actions[act]?.[1] ?? act) : "";
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
  later(() => pad.classList.remove("is-demo-hit", "is-hit"), 420);
}

// Audio is optional feedback: a failing or suspended AudioContext must never block input.
function playSound(name) {
  if (!session.soundEnabled) return;
  try {
    perc.play(name);
  } catch {
    // Ignore audio failures.
  }
}

function playDemo() {
  if (session.finished) return;
  clearTimers();
  isDemoPlaying = true;
  isAcceptingInput = false;
  currentInput = [];
  for (const pad of pads) pad.classList.remove("is-demo-hit", "is-hit");
  setTurn("demo");
  setKikiPose("neutral");
  setText(t.watch, t.watchHint);
  renderChips(currentPattern, 0, []);

  const beatMs = 640;
  currentPattern.forEach((act, i) => {
    later(
      () => {
        highlightChip(i, act);
        flashPad(act);
        setKikiPose(act);
        playSound(act);
      },
      400 + i * beatMs,
    );
  });
  later(
    () => {
      setKikiPose("neutral");
      isDemoPlaying = false;
      isAcceptingInput = true;
      setTurn("player");
      setText(t.turn, t.turnHint);
      renderChips(currentPattern, 0, []);
    },
    400 + (currentPattern.length - 1) * beatMs + 500,
  );
}

function handlePadInput(action) {
  if (session.finished || isDemoPlaying || !isAcceptingInput) return;
  playSound(action);
  flashPad(action);
  setKikiPose(action);
  later(() => {
    if (!isDemoPlaying && isAcceptingInput) setKikiPose("neutral");
  }, 400);

  currentInput.push(action);
  renderChips(currentPattern, currentInput.length, currentInput);

  if (currentInput.length === currentPattern.length) {
    isAcceptingInput = false;
    setTurn("feedback");
    checkSequence();
  }
}

function checkSequence() {
  const isMatch = currentInput.every((act, i) => act === currentPattern[i]);

  if (!isMatch) {
    // A complete wrong sequence counts as one attempt.
    session.mistakes++;
    session.hadMistake = true;
    setText(t.watch, t.wrong);
    setKikiPose("notice");
    bridge.track("round", { correct: false, afterMistake: false });
    later(playDemo, 1200);
    return;
  }

  setText(t.great, t.next);
  setKikiPose("celebrate");
  playSound("strum");
  const wasAfterMistake = session.hadMistake;
  session.rounds++;
  if (wasAfterMistake) session.corrections++;
  session.hadMistake = false;
  bridge.track("round", { correct: true, afterMistake: wasAfterMistake });

  if (session.rounds === 4) {
    session.finished = true;
    clearTimers();
    const done = document.createElement("div");
    done.className = "session-complete";
    const title = document.createElement("h1");
    title.textContent = t.doneTitle;
    const text = document.createElement("p");
    text.textContent = t.doneText;
    done.append(title, text);
    mainGame?.replaceChildren(done);
    setTurn("done");
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

  updateProgress();
  later(() => {
    currentPattern = patterns[session.rounds];
    playDemo();
  }, 1100);
}

// Sound is on by default; browsers only allow audio after a gesture,
// so unlock the AudioContext on the child's first touch or key press.
function unlockOnGesture() {
  if (!session.soundEnabled) return;
  try {
    perc.unlock();
  } catch {
    // Sound stays a no-op when audio cannot start.
  }
}
window.addEventListener("pointerdown", unlockOnGesture, { capture: true, once: true });
window.addEventListener("keydown", unlockOnGesture, { capture: true, once: true });

soundBtn?.addEventListener("click", () => {
  session.soundEnabled = !session.soundEnabled;
  if (session.soundEnabled) {
    try {
      perc.unlock();
    } catch {
      // Sound stays a no-op when audio cannot start.
    }
  }
  soundBtn.classList.toggle("is-active", session.soundEnabled);
  soundBtn.textContent = session.soundEnabled ? t.soundOn : t.soundOff;
});

replayBtn?.addEventListener("click", () => {
  if (isAcceptingInput && !isDemoPlaying && !session.finished) playDemo();
});

for (const pad of pads) {
  pad.addEventListener("click", () => {
    const action = pad.dataset.pad;
    if (action) handlePadInput(action);
  });
}

window.addEventListener(
  "pagehide",
  () => {
    session.finished = true;
    clearTimers();
    bridge.close();
  },
  { once: true },
);

applyStaticText();
updateProgress();
bridge.lifecycle("ready");
playDemo();
