import { HostBridge } from "@brainee/game-bridge";
import { validateLearningEvent } from "@brainee/game-bridge/learning";

const id = new URLSearchParams(location.search).get("id");
const game = await (await fetch(`/manifest/${id}.json`)).json();
const frame = document.createElement("iframe");
frame.title = game.title;
frame.dataset.testid = game.scored ? "embedded-game" : "explore-frame";
frame.dataset.ready = "false";
frame.sandbox.value =
  game.source === "remote" ? "allow-scripts" : "allow-scripts allow-same-origin";
frame.style.cssText = "width:100%;height:100dvh;border:0;display:block";
const events: { name: string; payload: Record<string, unknown> }[] = [];
const phases: string[] = [];
const accepted: unknown[] = [];
Object.assign(window, { gameEvents: events, gamePhases: phases, acceptedEvents: accepted });
const bridge = new HostBridge({
  frame: () => frame.contentWindow,
  context: {
    gameId: game.id,
    version: game.version ?? "0.1.0",
    sessionId: "isolated-test",
    locale: "en",
  },
  config: { level: 1, seed: 42, mode: game.scored ? "learn" : "explore", protocols: [2, 1] },
  acceptHello: (hello) => hello.contract === `${game.id}@1`,
  validateEvent(name, payload) {
    events.push({ name, payload });
    return game.scored ? validateLearningEvent(name, payload) : null;
  },
  onEvent(event) {
    accepted.push(event);
  },
  onLifecycle(phase) {
    phases.push(phase);
    if (phase === "ready") frame.dataset.ready = "true";
  },
});
bridge.start();
frame.src = `${game.entry}?level=1&seed=42`;
document.body.append(frame);
window.addEventListener("pagehide", () => bridge.close(), { once: true });
