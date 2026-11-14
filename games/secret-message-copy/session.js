const bridge = window.Brainee.connect({ contract: "secret-message-copy@1" });
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

const SYMBOL_DEFS = {
  star: { id: "star", label: "Звезда", stamp: "./assets/art/stamp-star.webp" },
  moon: { id: "moon", label: "Луна", stamp: "./assets/art/stamp-moon.webp" },
  heart: { id: "heart", label: "Сердце", stamp: "./assets/art/stamp-heart.webp" },
  leaf: { id: "leaf", label: "Лист", stamp: "./shared/assets/objects/leaf.webp" },
  sun: { id: "sun", label: "Солнце", stamp: "./shared/assets/objects/sun.webp" },
};

function createPattern(level, roundIndex) {
  const roundRng = mulberry32(session.seed + roundIndex * 83 + level * 29);
  let pool = ["star", "moon", "heart"];
  let len = 5;

  if (level === 2) {
    pool = ["star", "moon", "heart", "sun"];
    len = 6;
  } else if (level === 3) {
    pool = ["star", "moon", "heart", "leaf", "sun"];
    len = 7;
  }

  const res = [];
  for (let i = 0; i < len; i++) {
    res.push(pool[Math.floor(roundRng() * pool.length)]);
  }
  return res;
}

const patterns = [
  createPattern(session.level, 0),
  createPattern(session.level, 1),
  createPattern(session.level, 2),
  createPattern(session.level, 3),
];

// DOM references
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

let currentPattern = patterns[0];
let currentSelected = [];
let phase = "preview"; // "preview" | "recall"
let previewTimer = null;
let peekTimer = null;

function updateProgress() {
  if (progressEl) {
    progressEl.textContent = `Послание ${session.rounds + 1} из 4`;
  }
}

function renderTargetSequence(seq) {
  if (!memorySequenceEl) return;
  memorySequenceEl.replaceChildren();
  seq.forEach((id, idx) => {
    const item = SYMBOL_DEFS[id];
    const img = document.createElement("img");
    img.className = "symbol-token";
    img.src = item ? item.stamp : "./assets/art/stamp-star.webp";
    img.alt = item ? item.label : id;
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
      const id = selected[i];
      const item = SYMBOL_DEFS[id];
      slot.classList.add("is-filled");
      const img = document.createElement("img");
      img.className = "symbol-token copied-token";
      img.src = item ? item.stamp : "./assets/art/stamp-star.webp";
      img.alt = item ? item.label : id;
      slot.append(img);
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

  let pool = ["star", "moon", "heart"];
  if (level === 2) pool = ["star", "moon", "heart", "sun"];
  else if (level === 3) pool = ["star", "moon", "heart", "leaf", "sun"];

  pool.forEach((id) => {
    const item = SYMBOL_DEFS[id];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "stamp-button";
    btn.dataset.symbol = id;
    btn.setAttribute("aria-label", `Поставить ${item.label}`);

    const img = document.createElement("img");
    img.src = item.stamp;
    img.alt = item.label;
    btn.append(img);

    btn.addEventListener("click", () => {
      handleStampSelect(id);
    });

    stampDockEl.append(btn);
  });
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
  phase = "preview";

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
  if (messageEl) {
    messageEl.textContent = `Запомни секретное послание! (${revealSeconds} сек)`;
  }

  previewTimer = setTimeout(() => {
    enterRecallPhase();
  }, revealSeconds * 1000);
}

function enterRecallPhase() {
  phase = "recall";
  clearTimeout(previewTimer);
  memoryCoverEl?.classList.add("is-covered");
  memorySequenceEl?.classList.add("is-concealed");

  if (messageEl) {
    messageEl.textContent = "Восстанови секретное послание и нажми «Проверить»!";
  }
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
      messageEl.textContent = `Заполни все знаки (${currentSelected.length} из ${currentPattern.length})!`;
    }
    return;
  }

  // Full committed attempt
  const isMatch = currentSelected.every((id, idx) => id === currentPattern[idx]);

  if (isMatch) {
    phase = "feedback";
    // Correct!
    bridge.track("round", { correct: true, afterMistake: session.hadMistake });
    session.rounds++;
    if (session.hadMistake) session.corrections++;
    session.hadMistake = false;

    if (owlImg) owlImg.src = "./assets/art/owl-cheer.webp";

    if (session.rounds === 4) {
      session.finished = true;
      if (messageEl) messageEl.textContent = "Все 4 послания доставлены!";
      const gameRoot = document.getElementById("game");
      if (gameRoot) {
        const completeEl = document.createElement("div");
        completeEl.className = "session-complete";
        completeEl.innerHTML = `
          <h1>Все 4 секретных послания доставлены!</h1>
          <p>Сова-курьер успешно передала все сообщения получателям!</p>
        `;
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

    if (messageEl) messageEl.textContent = "Верно! Сообщение расшифровано.";
    setTimeout(() => {
      if (session.finished) return;
      startRound(session.rounds);
    }, 1100);
  } else {
    // Failed committed attempt
    session.mistakes++;
    session.hadMistake = true;
    bridge.track("round", { correct: false, afterMistake: false });

    // Visual feedback on wrong slots
    const slots = copySequenceEl?.querySelectorAll(".copy-slot");
    currentSelected.forEach((id, idx) => {
      if (id !== currentPattern[idx] && slots && slots[idx]) {
        slots[idx].classList.add("is-wrong");
        setTimeout(() => slots[idx].classList.remove("is-wrong"), 600);
      }
    });

    if (messageEl) {
      messageEl.textContent = "В послании есть ошибки. Проверь знаки и нажми ещё раз!";
    }
  }
}

// Action buttons
if (checkBtn) {
  checkBtn.addEventListener("click", checkRound);
}

if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    if (phase !== "recall" || session.finished) return;
    currentSelected = [];
    renderCopySlots(currentPattern.length, []);
  });
}

if (peekBtn) {
  peekBtn.addEventListener("click", handlePeek);
}

if (soundBtn) {
  soundBtn.addEventListener("click", () => {
    session.soundEnabled = !session.soundEnabled;
    soundBtn.classList.toggle("is-active", session.soundEnabled);
    soundBtn.textContent = session.soundEnabled ? "Звук: вкл" : "Звук: выкл";
  });
}

window.addEventListener(
  "pagehide",
  () => {
    session.finished = true;
    clearTimeout(previewTimer);
    clearTimeout(peekTimer);
    bridge.close();
  },
  { once: true },
);

// Start game
startRound(0);
bridge.lifecycle("ready");
