const bridge = window.Brainee.connect({ contract: "secret-message-copy@1" });
await bridge.ready;

// Game-local copy. The platform is English-only.
const t = {
  title: "Secret Message Lab",
  progress: (n) => `Message ${n} of 4`,
  soundOn: "Sound: on",
  soundOff: "Sound: off",
  preview: (s) => `Remember the secret message! (${s} s)`,
  recall: "Rebuild the secret message and press “Check”!",
  incomplete: (a, b) => `Fill in all the signs (${a} of ${b})!`,
  correct: "Correct! The message is decoded.",
  wrong: "The message has mistakes. Check the signs and try again!",
  doneStatus: "All 4 messages delivered!",
  doneTitle: "All 4 secret messages delivered!",
  doneText: "The owl courier delivered every message!",
  peek: "Peek",
  clear: "Clear",
  check: "Check",
  sheet: "Secret message sheet",
  sequence: "Secret signs to remember",
  copy: "Rebuilt message",
  dock: "Sign stamps",
  owl: "Owl courier",
  stamp: (label) => `Stamp “${label}”`,
  symbols: { star: "Star", moon: "Moon", heart: "Heart", leaf: "Leaf", sun: "Sun" },
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
  hintUsed: false,
  soundEnabled: false,
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

const SYMBOL_STAMPS = {
  star: "./assets/art/stamp-star.webp",
  moon: "./assets/art/stamp-moon.webp",
  heart: "./assets/art/stamp-heart.webp",
  leaf: "./shared/assets/objects/leaf.webp",
  sun: "./shared/assets/objects/sun.webp",
};

function symbolPool(level) {
  if (level === 2) return ["star", "moon", "heart", "sun"];
  if (level === 3) return ["star", "moon", "heart", "leaf", "sun"];
  return ["star", "moon", "heart"];
}

function createPattern(level, roundIndex) {
  const roundRng = mulberry32(session.seed + roundIndex * 83 + level * 29);
  const pool = symbolPool(level);
  const len = level === 1 ? 5 : level === 2 ? 6 : 7;
  const res = [];
  for (let i = 0; i < len; i++) {
    res.push(pool[Math.floor(roundRng() * pool.length)]);
  }
  return res;
}

const patterns = [0, 1, 2, 3].map((round) => createPattern(session.level, round));

// DOM references
const gameRoot = document.getElementById("game");
const progressEl = document.querySelector(".session-progress");
const messageEl = document.querySelector(".session-message");
const memorySequenceEl = document.getElementById("memory-sequence");
const memoryCoverEl = document.getElementById("memory-cover");
const copySequenceEl = document.getElementById("memory-copy");
const stampDockEl = document.getElementById("stamp-dock");
const checkBtn = document.querySelector("[data-action='check']");
const clearBtn = document.querySelector("[data-action='clear']");
const peekBtn = document.querySelector("[data-action='peek']");
const soundBtn = document.querySelector("[data-action='toggle-sound']");
const owlImg = document.getElementById("play-owl");

function applyStaticText() {
  document.title = t.title;
  if (soundBtn) soundBtn.textContent = t.soundOff;
  if (peekBtn) peekBtn.textContent = t.peek;
  if (clearBtn) clearBtn.textContent = t.clear;
  if (checkBtn) checkBtn.textContent = t.check;
  const sheet = document.querySelector(".paper-sheet");
  if (sheet) sheet.alt = t.sheet;
  memorySequenceEl?.setAttribute("aria-label", t.sequence);
  copySequenceEl?.setAttribute("aria-label", t.copy);
  stampDockEl?.setAttribute("aria-label", t.dock);
  if (owlImg) owlImg.alt = t.owl;
}

let currentPattern = patterns[0];
let currentSelected = [];
let phase = "preview"; // "preview" | "recall" | "feedback"
let previewTimer = null;
let peekTimer = null;
// Feedback timers (wrong-slot flash, next round), cleared when the player leaves.
const timers = new Set();

function later(fn, ms) {
  const id = setTimeout(() => {
    timers.delete(id);
    if (!session.finished) fn();
  }, ms);
  timers.add(id);
}

// `data-turn` exposes the phase (preview | recall | feedback | done) without relying on copy.
function setPhase(next) {
  phase = next;
  gameRoot?.setAttribute("data-turn", next);
}

function symbolImage(id, className) {
  const img = document.createElement("img");
  img.className = className;
  img.src = SYMBOL_STAMPS[id] ?? SYMBOL_STAMPS.star;
  img.alt = t.symbols[id] ?? id;
  return img;
}

function updateProgress() {
  if (progressEl) progressEl.textContent = t.progress(session.rounds + 1);
}

function renderTargetSequence(seq) {
  if (!memorySequenceEl) return;
  memorySequenceEl.replaceChildren();
  seq.forEach((id, idx) => {
    const img = symbolImage(id, "symbol-token");
    img.dataset.index = String(idx);
    memorySequenceEl.append(img);
  });
}

function renderCopySlots(seqLength, selected) {
  if (!copySequenceEl) return;
  copySequenceEl.replaceChildren();
  for (let i = 0; i < seqLength; i++) {
    const slot = document.createElement("span");
    slot.className = "copy-slot";
    slot.dataset.index = String(i);

    if (i < selected.length) {
      slot.classList.add("is-filled");
      slot.append(symbolImage(selected[i], "symbol-token copied-token"));
    }
    // Clicking a filled slot removes it and subsequent items
    slot.addEventListener("click", () => {
      if (phase !== "recall" || session.finished) return;
      if (i < currentSelected.length) {
        currentSelected = currentSelected.slice(0, i);
        renderCopySlots(currentPattern.length, currentSelected);
      }
    });

    copySequenceEl.append(slot);
  }
}

function renderStamps(level) {
  if (!stampDockEl) return;
  stampDockEl.replaceChildren();

  for (const id of symbolPool(level)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "stamp-button";
    btn.dataset.symbol = id;
    btn.setAttribute("aria-label", t.stamp(t.symbols[id]));
    btn.append(symbolImage(id, ""));
    btn.addEventListener("click", () => handleStampSelect(id));
    stampDockEl.append(btn);
  }
}

function handleStampSelect(symbolId) {
  if (phase !== "recall" || session.finished) return;
  if (currentSelected.length >= currentPattern.length) return;

  currentSelected.push(symbolId);
  renderCopySlots(currentPattern.length, currentSelected);
}

function startRound(roundIdx) {
  if (session.finished) return;
  clearTimeout(previewTimer);
  clearTimeout(peekTimer);

  session.hintUsed = false;
  currentPattern = patterns[roundIdx];
  currentSelected = [];
  setPhase("preview");

  updateProgress();
  if (owlImg) owlImg.src = "./assets/art/owl-neutral.webp";
  if (peekBtn) {
    peekBtn.hidden = session.level < 3;
    peekBtn.disabled = false;
  }

  // Preview phase setup
  memoryCoverEl?.classList.remove("is-covered", "is-peeking");
  memorySequenceEl?.classList.remove("is-concealed");
  renderTargetSequence(currentPattern);
  renderCopySlots(currentPattern.length, []);
  renderStamps(session.level);

  const revealSeconds = session.level === 1 ? 6 : 5;
  if (messageEl) messageEl.textContent = t.preview(revealSeconds);

  previewTimer = setTimeout(enterRecallPhase, revealSeconds * 1000);
}

function enterRecallPhase() {
  if (session.finished) return;
  clearTimeout(previewTimer);
  setPhase("recall");
  memoryCoverEl?.classList.add("is-covered");
  memorySequenceEl?.classList.add("is-concealed");
  if (messageEl) messageEl.textContent = t.recall;
}

function handlePeek() {
  if (phase !== "recall" || session.finished || session.hintUsed) return;
  session.hintUsed = true;
  if (peekBtn) peekBtn.disabled = true;

  memoryCoverEl?.classList.remove("is-covered");
  memoryCoverEl?.classList.add("is-peeking");
  memorySequenceEl?.classList.remove("is-concealed");

  peekTimer = setTimeout(() => {
    memoryCoverEl?.classList.remove("is-peeking");
    memoryCoverEl?.classList.add("is-covered");
    memorySequenceEl?.classList.add("is-concealed");
  }, 1500);
}

function checkRound() {
  if (session.finished) return; // repeated Check does not duplicate finish
  if (phase === "preview") {
    // If child is ready early during preview, switch to recall
    enterRecallPhase();
    return;
  }

  if (phase !== "recall") return;

  // If sequence is incomplete, prompt child to fill all slots (not a failed attempt)
  if (currentSelected.length < currentPattern.length) {
    if (messageEl) {
      messageEl.textContent = t.incomplete(currentSelected.length, currentPattern.length);
    }
    return;
  }

  // Full committed attempt
  const isMatch = currentSelected.every((id, idx) => id === currentPattern[idx]);

  if (!isMatch) {
    session.mistakes++;
    session.hadMistake = true;
    bridge.track("round", { correct: false, afterMistake: false });

    // Visual feedback on wrong slots
    const slots = copySequenceEl?.querySelectorAll(".copy-slot");
    currentSelected.forEach((id, idx) => {
      const slot = slots?.[idx];
      if (id !== currentPattern[idx] && slot) {
        slot.classList.add("is-wrong");
        later(() => slot.classList.remove("is-wrong"), 600);
      }
    });
    if (messageEl) messageEl.textContent = t.wrong;
    return;
  }

  setPhase("feedback");
  bridge.track("round", { correct: true, afterMistake: session.hadMistake });
  session.rounds++;
  if (session.hadMistake) session.corrections++;
  session.hadMistake = false;

  if (owlImg) owlImg.src = "./assets/art/owl-cheer.webp";

  if (session.rounds === 4) {
    session.finished = true;
    clearTimeout(peekTimer);
    setPhase("done");
    if (messageEl) messageEl.textContent = t.doneStatus;
    if (gameRoot) {
      const completeEl = document.createElement("div");
      completeEl.className = "session-complete";
      const title = document.createElement("h1");
      title.textContent = t.doneTitle;
      const text = document.createElement("p");
      text.textContent = t.doneText;
      completeEl.append(title, text);
      gameRoot.append(completeEl);
    }
    bridge.track("finish", {
      gameId: "secret-message-copy",
      level: session.level,
      rounds: session.rounds,
      mistakes: session.mistakes,
      corrections: session.corrections,
      durationMs: Math.round(performance.now() - session.started),
    });
    return;
  }

  if (messageEl) messageEl.textContent = t.correct;
  later(() => startRound(session.rounds), 1100);
}

// Action buttons
checkBtn?.addEventListener("click", checkRound);

clearBtn?.addEventListener("click", () => {
  if (phase !== "recall" || session.finished) return;
  currentSelected = [];
  renderCopySlots(currentPattern.length, []);
});

peekBtn?.addEventListener("click", handlePeek);

soundBtn?.addEventListener("click", () => {
  session.soundEnabled = !session.soundEnabled;
  soundBtn.classList.toggle("is-active", session.soundEnabled);
  soundBtn.textContent = session.soundEnabled ? t.soundOn : t.soundOff;
});

window.addEventListener(
  "pagehide",
  () => {
    session.finished = true;
    clearTimeout(previewTimer);
    clearTimeout(peekTimer);
    for (const id of timers) clearTimeout(id);
    timers.clear();
    bridge.close();
  },
  { once: true },
);

// Start game
applyStaticText();
startRound(0);
bridge.lifecycle("ready");
