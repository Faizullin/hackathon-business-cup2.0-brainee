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
  message: "Нажми на деталь, затем на её место. Собери весь силуэт и проверь.",
};
rng = mulberry32(Number(bridge.config?.seed) || 42);
const sequence = shuffle(config.tales, rng).slice(0, 4);
function checkRound() {
  if (session.finished) return;
  if (Object.keys(state.placements).length !== 7) {
    session.mistakes++;
    session.hadMistake = true;
    session.message = "Ещё остались детали. Попробуй закончить силуэт.";
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
    cleanup();
    mount.innerHTML =
      '<section class="session-complete"><h1>Все четыре силуэта готовы!</h1></section>';
    bridge.track("finish", {
      gameId: "tangram-tales",
      level: session.level,
      rounds: session.rounds,
      mistakes: session.mistakes,
      corrections: session.corrections,
      durationMs: Math.round(performance.now() - session.started),
    });
  } else {
    session.message = "Получилось! Собери следующий силуэт.";
    startTale(sequence[session.rounds].id);
  }
}
window.addEventListener(
  "pagehide",
  () => {
    session.finished = true;
    cleanup();
    bridge.close();
  },
  { once: true },
);
await startTale(sequence[0].id);
bridge.lifecycle("ready");
