/**
 * The drop-in build (`bridge.js`) for code that can't import
 * TypeScript: GDevelop JavaScript events and uploaded third-party builds.
 *
 * ```html
 * <script src="bridge.js" data-contract="my-game@1"></script>
 * <script>Brainee.track("level_completed", { level: 2 })</script>
 * ```
 *
 * With `data-contract` the script connects at once and reports `ready` when
 * the page has loaded; without it, the first call connects.
 */

import { autoAdapter } from "./adapters";
import type { HostMethods, MethodArgs } from "./contract";
import { contextFromUrl, GameBridge } from "./game";
import type { GamePhase } from "./protocol";

const script =
  typeof document !== "undefined" ? (document.currentScript as HTMLScriptElement | null) : null;
const declaredContract = script?.dataset.contract;

let bridge: GameBridge | null = null;

function connect(options: { contract?: string } = {}): GameBridge {
  bridge ??= GameBridge.connect({
    contract: options.contract ?? declaredContract ?? "custom@1",
    adapter: autoAdapter(),
    fallback: () => ({ context: contextFromUrl() }),
  });
  return bridge;
}

const api = {
  connect,
  track: (name: string, payload: Record<string, unknown> = {}) => connect().track(name, payload),
  setState: (key: string, value: unknown) => connect().state.set(key, value),
  lifecycle: (phase: GamePhase, detail?: Record<string, unknown>) =>
    connect().lifecycle(phase, detail),

  call: <K extends keyof HostMethods>(method: K, ...args: MethodArgs<HostMethods[K]>) =>
    connect().host.call(method, ...args),
  onConfig: (listener: (config: unknown) => void) => connect().onConfig(listener),
};

declare global {
  interface Window {
    Brainee?: typeof api;
  }
}

window.Brainee = api;

if (declaredContract) {
  const connected = connect();
  const reportReady = () => connected.lifecycle("ready");
  if (document.readyState === "complete") reportReady();
  else window.addEventListener("load", reportReady, { once: true });
}
