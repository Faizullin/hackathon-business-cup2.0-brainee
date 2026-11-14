// biome-ignore-all lint/correctness/noUnusedVariables: appended to the upstream engine module
// Appended to the pinned QLOBE guided engine by build-tangram.mjs.
const bridge = window.Brainee.connect({ contract: "tangram-tales@1" });
await bridge.ready;
const session = {
  level: Math.max(1, Math.min(3, Number(bridge.config?.level) || 1)),
  rounds: 0,
  mistakes: 0,
  corrections: 0,
  hadMistake: false,
  finished: false,
  started: performance.now(),
  message: "Tap a piece, then its spot. Finish the whole picture and press Check.",
};
rng = mulberry32(Number(bridge.config?.seed) || 42);
const sequence = shuffle(config.tales, rng).slice(0, 4);
// A solved picture stays on screen briefly; Check is ignored meanwhile, so a double tap cannot
// grade the next, still empty picture. `data-turn` (play | feedback | done) exposes this state.
const FEEDBACK_MS = 700;
let feedbackTimer = 0;
mount.dataset.turn = "play";
function checkRound() {
  if (session.finished || mount.dataset.turn !== "play") return;
  if (Object.keys(state.placements).length !== 7) {
    session.mistakes++;
    session.hadMistake = true;
    session.message = "Some pieces are still missing. Try to finish the picture.";
    bridge.track("round", { correct: false, afterMistake: false });
    renderGuided();
    return;
  }
  bridge.track("round", { correct: true, afterMistake: session.hadMistake });
  session.rounds++;
  if (session.hadMistake) session.corrections++;
  session.hadMistake = false;
  if (session.rounds === 4) {
    session.finished = true;
    mount.dataset.turn = "done";
    cleanup();
    mount.innerHTML =
      '<section class="session-complete"><h1>All four puzzles are done!</h1></section>';
    bridge.track("finish", {
      gameId: "tangram-tales",
      level: session.level,
      rounds: session.rounds,
      mistakes: session.mistakes,
      corrections: session.corrections,
      durationMs: Math.round(performance.now() - session.started),
    });
  } else {
    session.message = "You did it! Build the next picture.";
    mount.dataset.turn = "feedback";
    const status = mount.querySelector('[role="status"]');
    if (status) status.textContent = session.message;
    feedbackTimer = setTimeout(async () => {
      if (session.finished) return;
      await startTale(sequence[session.rounds].id);
      mount.dataset.turn = "play";
    }, FEEDBACK_MS);
  }
}
window.addEventListener(
  "pagehide",
  () => {
    session.finished = true;
    clearTimeout(feedbackTimer);
    cleanup();
    bridge.close();
  },
  { once: true },
);
await startTale(sequence[0].id);
bridge.lifecycle("ready");
