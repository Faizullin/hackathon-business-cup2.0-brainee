/**
 * The game side. One concrete class for every engine; the engine-specific part
 * is an `EngineAdapter` passed in `options.adapter`.
 *
 * ```ts
 * const bridge = GameBridge.connect<PuzzleContract>({ contract: "puzzle@1", adapter })
 * await bridge.ready            // true when a host answered, false when unbridged
 * bridge.track("piece_placed", { piece, attempts })
 * bridge.state.set("placed", 3)
 * await bridge.host.call("session.exit")
 * ```
 */

import {
  BUILTIN_GAME_METHODS,
  type EngineAdapter,
  type GameContract,
  type HostMethods,
  type Implementation,
  type MethodArgs,
  type MethodResult,
} from "./contract";
import { type AnyMethod, Endpoint } from "./endpoint";
import {
  BRIDGE_PROTOCOL,
  BRIDGE_TAG,
  BridgeError,
  type BridgeErrorCode,
  createId,
  type GamePhase,
  type HelloMessage,
  isWelcome,
  type LaunchContext,
  LOCALES,
  type Locale,
  mergeConfig,
  type PortMessage,
  parsePortMessage,
  type WindowLike,
} from "./protocol";
import { portTransport, type Transport } from "./transport";

export const DEFAULT_HANDSHAKE_TIMEOUT_MS = 5000;
export const DEFAULT_HELLO_INTERVAL_MS = 250;
/**
 * After the handshake timeout the game runs unbridged but keeps saying hello
 * this often: store pages render the game's iframe on the server, so a slow
 * phone or network can start the host long after the game.
 */
export const DEFAULT_LATE_HELLO_INTERVAL_MS = 2000;
/** Events and lifecycle kept while not connected; the oldest go first. */
export const MAX_BUFFERED_MESSAGES = 500;

export type GameBridgeStatus = "connecting" | "connected" | "unbridged" | "closed";

export interface GameBridgeFallback<C extends GameContract> {
  context?: Partial<LaunchContext>;
  config?: C["config"];
}

export interface GameBridgeOptions<C extends GameContract> {
  /** The game's contract id, e.g. "puzzle@1". */
  contract: string;
  /** Host → game methods from the contract. */
  methods?: Partial<Implementation<C["methods"]>>;
  /** Backs the built-in `pause` / `resume` / `restart` / `snapshot`. */
  adapter?: EngineAdapter;
  /** Launch data when no host answers (a build opened on its own). */
  fallback?: () => GameBridgeFallback<C>;
  /** Connect over this instead of the window handshake (`/phaser`). */
  transport?: Transport;
  /** Defaults to `window`. */
  self?: WindowLike;
  /** Defaults to `window.parent` when the game is framed. */
  parent?: WindowLike;
  handshakeTimeoutMs?: number;
  helloIntervalMs?: number;
  lateHelloIntervalMs?: number;
  callTimeoutMs?: number;
}

type Listener<T> = (value: T) => void;

function emit<T>(listeners: Set<Listener<T>>, value: T) {
  for (const listener of listeners) {
    try {
      listener(value);
    } catch (error) {
      console.error("[bridge] listener failed", error);
    }
  }
}

/** Builtin method → the lifecycle phase the game reports after running it. */
const BUILTIN_PHASES: Partial<Record<string, GamePhase>> = {
  pause: "paused",
  resume: "resumed",
  restart: "started",
};

export class GameBridge<C extends GameContract = GameContract> {
  static connect<C extends GameContract>(options: GameBridgeOptions<C>): GameBridge<C> {
    const bridge = new GameBridge<C>(options);
    bridge.start();
    return bridge;
  }

  /** New per page load, so a reloaded frame gets a fresh connection. */
  readonly nonce = createId();
  /** `true` once the host sent `init`, `false` if the game runs unbridged. */
  readonly ready: Promise<boolean>;
  context: LaunchContext | null = null;
  config: C["config"] | undefined = undefined;

  private readonly options: GameBridgeOptions<C>;
  private currentStatus: GameBridgeStatus = "connecting";
  private endpoint: Endpoint | null = null;
  private resolveReady: (bridged: boolean) => void = () => {};
  private buffer: PortMessage[] = [];
  private pendingState: Record<string, unknown> = {};
  private readonly configListeners = new Set<Listener<C["config"]>>();
  private readonly stateListeners = new Set<Listener<Record<string, unknown>>>();
  private readonly lifecycleListeners = new Set<
    Listener<{ phase: GamePhase; detail?: Record<string, unknown> }>
  >();
  private readonly cleanup: Array<() => void> = [];
  private handshakeTimer: ReturnType<typeof setTimeout> | null = null;
  private stopHello: () => void = () => {};

  constructor(options: GameBridgeOptions<C>) {
    this.options = options;
    this.ready = new Promise((resolve) => {
      this.resolveReady = resolve;
    });
  }

  get status(): GameBridgeStatus {
    return this.currentStatus;
  }

  get bridged(): boolean {
    return this.currentStatus === "connected";
  }

  /** Allowlisted function calls into the host (session exit). */
  readonly host = {
    call: async <K extends keyof HostMethods>(
      method: K,
      ...args: MethodArgs<HostMethods[K]>
    ): Promise<MethodResult<HostMethods[K]>> => {
      await this.ready;
      if (!this.endpoint || !this.bridged) {
        throw new BridgeError("unavailable", `No host for ${method}`);
      }
      if (!this.context?.hostMethods.includes(method)) {
        throw new BridgeError("not-allowed", `${method} is not offered by this host`);
      }
      return (await this.endpoint.call(method, args)) as MethodResult<HostMethods[K]>;
    },
    /** Whether the host offers `method` in this session. */
    has: (method: keyof HostMethods): boolean =>
      this.bridged && Boolean(this.context?.hostMethods.includes(method)),
  };

  /** Fast, lossy state: latest value per key, at most 20 updates a second. */
  readonly state = {
    set: <K extends keyof C["state"] & string>(key: K, value: C["state"][K]) => {
      if (this.endpoint && this.bridged) this.endpoint.setState(key, value);
      else if (this.currentStatus !== "closed") this.pendingState[key] = value;
    },
    /** State the host pushes (e.g. editor sliders while dragging). */
    on: (listener: Listener<Record<string, unknown>>) => {
      this.stateListeners.add(listener);
      return () => this.stateListeners.delete(listener);
    },
  };

  /** Reliable, ordered events; buffered until the host connects. */
  track<K extends keyof C["events"] & string>(name: K, payload: C["events"][K]) {
    this.post({
      kind: "event",
      eventId: createId(),
      name,
      payload: payload as Record<string, unknown>,
      at: new Date().toISOString(),
    });
  }

  lifecycle(phase: GamePhase, detail?: Record<string, unknown>) {
    this.post(detail ? { kind: "lifecycle", phase, detail } : { kind: "lifecycle", phase });
  }

  /** Called with the first config (from `init` or the fallback) and every patch. */
  onConfig(listener: Listener<C["config"]>) {
    this.configListeners.add(listener);
    return () => this.configListeners.delete(listener);
  }

  onLifecycle(listener: Listener<{ phase: GamePhase; detail?: Record<string, unknown> }>) {
    this.lifecycleListeners.add(listener);
    return () => this.lifecycleListeners.delete(listener);
  }

  close() {
    if (this.currentStatus === "closed") return;
    this.currentStatus = "closed";
    this.clearHandshake();
    for (const stop of this.cleanup.splice(0)) stop();
    this.endpoint?.close();
    this.endpoint = null;
    this.buffer = [];
    this.pendingState = {};
    this.resolveReady(false);
  }

  private start() {
    const timeoutMs = this.options.handshakeTimeoutMs ?? DEFAULT_HANDSHAKE_TIMEOUT_MS;

    if (this.options.transport) {
      this.attach(this.options.transport);
      this.handshakeTimer = setTimeout(() => this.goUnbridged(), timeoutMs);
      return;
    }

    const hasWindow = typeof window !== "undefined";
    const self: WindowLike | undefined = this.options.self ?? (hasWindow ? window : undefined);
    const parent: WindowLike | undefined =
      this.options.parent ?? (hasWindow && window.parent !== window ? window.parent : undefined);
    if (!self || !parent) {
      this.goUnbridged();
      return;
    }

    // The nonce is the check, not `event.source`: only the parent saw the
    // hello, and WebKit doesn't keep window proxies identical across messages.
    const onMessage = (event: MessageEvent) => {
      if (
        !isWelcome(event.data) ||
        event.data.nonce !== this.nonce ||
        ![BRIDGE_PROTOCOL, BRIDGE_PROTOCOL - 1].includes(event.data.protocol)
      )
        return;
      const port = event.ports?.[0];
      if (!port || this.currentStatus === "closed") return;
      this.stopHello();
      self.removeEventListener("message", onMessage);
      this.attach(portTransport(port));
    };
    self.addEventListener("message", onMessage);
    this.cleanup.push(() => self.removeEventListener("message", onMessage));

    const hello: HelloMessage = {
      bridge: BRIDGE_TAG,
      type: "hello",
      protocol: BRIDGE_PROTOCOL,
      contract: this.options.contract,
      nonce: this.nonce,
    };
    // The hello carries nothing secret; a sandboxed frame can't name an origin.
    const sayHello = () => parent.postMessage(hello, "*");
    sayHello();
    const interval = setInterval(
      sayHello,
      this.options.helloIntervalMs ?? DEFAULT_HELLO_INTERVAL_MS,
    );
    this.stopHello = () => clearInterval(interval);
    this.cleanup.push(this.stopHello);

    this.handshakeTimer = setTimeout(() => {
      this.stopHello();
      this.goUnbridged();
      // A host that answers late still connects; buffered events then flush.
      const late = setInterval(
        sayHello,
        this.options.lateHelloIntervalMs ?? DEFAULT_LATE_HELLO_INTERVAL_MS,
      );
      this.stopHello = () => clearInterval(late);
      this.cleanup.push(this.stopHello);
    }, timeoutMs);
  }

  private attach(transport: Transport) {
    const endpoint = new Endpoint({
      transport,
      callTimeoutMs: this.options.callTimeoutMs,
      resolveMethod: (name) => this.resolveMethod(name),
    });
    this.endpoint?.close();
    this.endpoint = endpoint;
    this.cleanup.push(transport.listen((data) => this.receive(endpoint, data)));
  }

  private receive(endpoint: Endpoint, data: unknown) {
    if (endpoint !== this.endpoint) return;
    const message = parsePortMessage(data);
    if (!message || endpoint.handle(message)) return;

    switch (message.kind) {
      case "init":
        this.context = message.context;
        this.config = message.config as C["config"];
        this.currentStatus = "connected";
        this.clearHandshake();
        for (const queued of this.buffer.splice(0)) endpoint.send(queued);
        for (const [key, value] of Object.entries(this.pendingState)) {
          endpoint.setState(key, value);
        }
        this.pendingState = {};
        this.resolveReady(true);
        emit(this.configListeners, this.config);
        break;
      case "config":
        this.config = mergeConfig(this.config, message.config) as C["config"];
        emit(this.configListeners, this.config);
        break;
      case "state":
        emit(this.stateListeners, message.values);
        break;
      case "lifecycle":
        emit(this.lifecycleListeners, {
          phase: message.phase,
          detail: message.detail,
        });
        break;
    }
  }

  private resolveMethod(name: string): AnyMethod | BridgeErrorCode {
    const methods = this.options.methods as Record<string, unknown> | undefined;
    const own = methods?.[name];
    if (typeof own === "function") {
      return (...args: unknown[]) => (own as AnyMethod).apply(methods, args);
    }

    const adapter = this.options.adapter;
    if (!adapter || !(BUILTIN_GAME_METHODS as readonly string[]).includes(name)) {
      return "unknown-method";
    }
    const builtin = adapter[name as keyof EngineAdapter];
    if (typeof builtin !== "function") return "unknown-method";
    return async () => {
      const value = await (builtin as AnyMethod).call(adapter);
      const phase = BUILTIN_PHASES[name];
      if (phase) this.lifecycle(phase);
      return value ?? null;
    };
  }

  private post(message: PortMessage) {
    if (this.currentStatus === "closed") return;
    if (this.endpoint && this.bridged) {
      this.endpoint.send(message);
      return;
    }
    // Keep buffering while unbridged too: a slow host may still answer.
    this.buffer.push(message);
    if (this.buffer.length > MAX_BUFFERED_MESSAGES) this.buffer.shift();
  }

  private goUnbridged() {
    if (this.currentStatus !== "connecting") return;
    this.clearHandshake();
    this.currentStatus = "unbridged";
    const fallback = this.options.fallback?.() ?? {};
    this.context = {
      sessionId: createId(),
      gameId: "",
      version: null,
      locale: "en",
      ...fallback.context,
      hostMethods: [],
    };
    this.config = fallback.config;
    this.resolveReady(false);
    if (this.config !== undefined) emit(this.configListeners, this.config);
  }

  private clearHandshake() {
    if (this.handshakeTimer) clearTimeout(this.handshakeTimer);
    this.handshakeTimer = null;
  }
}

/**
 * Context from today's URL params (`gameId`, `lang`), for
 * `options.fallback` when a build is opened on its own.
 */
export function contextFromUrl(
  search: string = typeof location !== "undefined" ? location.search : "",
): Partial<LaunchContext> {
  const params = new URLSearchParams(search);
  const lang = params.get("lang");
  const context: Partial<LaunchContext> = {};
  const gameId = params.get("gameId");
  if (gameId) context.gameId = gameId;
  if ((LOCALES as readonly string[]).includes(lang ?? "")) context.locale = lang as Locale;
  return context;
}
